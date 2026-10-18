# Deno → Bun Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run all repo tooling (generator, linters, validators, tests, release gate) on Bun instead of Deno, with Node pinned at 26.12.0, and every `mise run <task>` name unchanged.

**Architecture:** TypeScript stays; `Deno.*` and `@std/*` are replaced with Node built-ins (which Bun implements). JS dev dependencies live in a private, hand-maintained `scripts/package.json` + `bun.lock`; mise puts `scripts/node_modules/.bin` on PATH and owns every task command directly. Prettier replaces `deno fmt` (including inside the generator's primer step), oxlint replaces `deno lint`, `tsc --noEmit` replaces `deno check`, `bun test` replaces `deno test`.

**Tech Stack:** Bun, Node 26.12.0, TypeScript, Prettier 3, oxlint, `bun:test`, mise.

**Spec:** `docs/superpowers/specs/2026-10-18-deno-to-bun-design.md`

## Global Constraints

- Node `26.12.0`; Bun pinned exact via `mise use --pin bun@<v>` — newest release at least 14 days old (repo `minimumReleaseAge: "14 days"`). Same 14-day rule and exact pins (no `^`/`~`) for every npm devDependency.
- No `Bun.*` APIs in `scripts/**` (tests may import `bun:test`). No `Deno.*`, no `@std/*`, no `jsr:`/`npm:` specifiers left.
- Root `package.json` is generator-owned: never edit it by hand, never add deps to it.
- Every existing mise task name keeps its meaning: `generate check test rasterize fmt fmt-check lint lint-workflows typecheck validate-manifests lint-skills lint-commits eval-triggers eval-behavior release`.
- Commands live only in `mise.toml`. `deno.json` and `deno.lock` are deleted.
- Prettier ignores: everything in `deno.json` `fmt.exclude`, plus `docs/superpowers/**`, `evals/**`, `scripts/node_modules/**`, and the generated JSON manifests (see Task 4).
- `skills/**` markdown: `proseWrap: "preserve"`, `embeddedLanguageFormatting: "off"`; every SKILL.md frontmatter byte-identical before/after.
- oxlint ignores: `scripts/templates/pi`, `scripts/templates/opencode`, `.pi/extensions`, `.opencode/plugins` (from `deno.json` `lint.exclude`).
- User-facing strings: "Run `deno task generate`" → "Run `mise run generate`".
- Commits are Conventional Commits with types `build`/`chore`/`ci`/`style`/`docs`/`test` only — no `feat`/`fix`.
- Port commits (Tasks 2–4) are made with `git commit --no-verify` and say so in the body; Tasks 1, 5, 6 must pass the pre-commit gate normally.
- Do not touch Deno mentions under `skills/`, `evals/`, or `docs/superpowers/` (other than this plan and its spec).

## Review Focus

1. **Prettier rewrites a SKILL.md frontmatter `description:`** (fold, quote, escape) → harness triggering silently changes. Expected: frontmatter untouched. Pinned by `skill frontmatter is a Prettier fixed point` (Task 4).
2. **`generate` and `fmt` fight** — generator output that Prettier would reformat, e.g. `JSON.stringify` arrays Prettier collapses to one line, or the primer. Expected: `mise run fmt && mise run check` is clean. Pinned by `every generated file is Prettier-ignored or a Prettier fixed point` (Task 4) and `renderPrimer output is a Prettier fixed point` (Task 3).
3. **Fresh clone / CI with no `scripts/node_modules`** → `prettier: command not found`. Expected: any task installs deps first. Pinned by the Task 6 verification `rm -rf scripts/node_modules && mise run release`.
4. **`lint-commits` exit codes and stderr under Bun** (`process.exit` inside `try`, git spawn errors) — must still exit 2 with no stack trace. Pinned by the existing 4 tests in `scripts/lint-commits_test.ts`, ported in Task 3 to spawn `process.execPath`.
5. **resvg native module under Bun** produces a different PNG. Expected: `mise run rasterize` leaves `assets/app-icon.png` byte-identical. Pinned by the Task 6 verification `git diff --exit-code assets/app-icon.png`.

---

### Task 1: Commit the Node bump

**Files:**
- Modify: `mise.toml:5` (already changed in the working tree: `node = "26.12.0"`)

- [ ] **Step 1:** Run `mise install && mise run release`. Expected: passes (still on Deno).
- [ ] **Step 2:** Commit only `mise.toml` (leave the untracked `test` file alone).

```bash
git add mise.toml
git commit -m "build: bump node to 26.12.0"
```

---

### Task 2: Bun toolchain and JS dependencies

**Files:**
- Modify: `mise.toml` (`[tools]`, new `[env]`, new `[tasks.deps]`)
- Create: `scripts/package.json`, `scripts/bun.lock`, `scripts/tsconfig.json`

**Interfaces:**
- Produces: `mise run deps` (runs `bun install --frozen-lockfile` with `dir = "scripts"`); `prettier`, `oxlint`, `tsc` on PATH inside mise via `[env] _.path = ["{{config_root}}/scripts/node_modules/.bin"]`; `tsc -p scripts` type-checks `scripts/**/*.ts` (excluding `scripts/templates/**`, `scripts/node_modules/**`) plus `../marketplace.config.ts`.

- [ ] **Step 1:** `mise use --pin bun@<version>` (per Global Constraints). Keep `deno` in `[tools]` for now; Task 4 removes it.
- [ ] **Step 2:** Create `scripts/package.json`: `"name": "devkit-scripts"`, `"private": true`, `"type": "module"`, `devDependencies` with exact versions of `prettier`, `oxlint`, `typescript`, `@types/bun`, `@cfworker/json-schema` (4.x), `@resvg/resvg-js` `2.6.2`. Run `bun install` in `scripts/` to create `bun.lock`.
- [ ] **Step 3:** Create `scripts/tsconfig.json`: `strict`, `noEmit`, `target`/`module` `ESNext`, `moduleResolution: "bundler"`, `allowImportingTsExtensions`, `types: ["bun"]`, `skipLibCheck`; `include` `["**/*.ts", "../marketplace.config.ts"]`; `exclude` `["templates", "node_modules"]`.
- [ ] **Step 4:** Add `[env]` PATH entry and `[tasks.deps]` to `mise.toml`.
- [ ] **Step 5:** Verify: `mise run deps && mise exec -- tsc --version && mise exec -- prettier --version && mise exec -- oxlint --version`. Expected: three versions print. `git status --short` shows no `scripts/node_modules`.
- [ ] **Step 6:** Commit (`--no-verify`): `build: add bun toolchain and scripts/ dev dependencies`.

---

### Task 3: Port scripts and tests off Deno

**Files:**
- Modify: every file under `scripts/` that `grep -rln "Deno\.\|@std/" scripts` lists (32 files; not `scripts/templates/**`).
- Key changes: `scripts/lib/files.ts`, `scripts/lib/lint/discover.ts`, `scripts/lib/lint/commits.ts`, `scripts/lib/validate/validate.ts`, `scripts/lib/render-templated.ts`, `scripts/lib/render-primer.ts`, `scripts/generate.ts`, `scripts/lint-skills.ts`, `scripts/lint-commits.ts`, `scripts/validate-manifests.ts`, `scripts/rasterize.ts`, all `*_test.ts`.

**Interfaces:**
- Consumes: Task 2's deps and tsconfig.
- Produces: unchanged exported signatures everywhere. `renderPrimer(skillsDir: string, bootstrapSkill: string): Promise<GeneratedFile[]>` now formats via Prettier's API (`resolveConfig(<absolute primer path>)` then `format(src, { ...config, filepath })`). With no Prettier config yet, defaults apply; Task 4's config is picked up automatically.

Mapping (apply mechanically):

| Deno | Replacement |
| --- | --- |
| `Deno.readTextFile/writeTextFile/writeFile/mkdir/readDir/stat/chmod/remove/makeTempDir` | `node:fs/promises` (`readFile(p, "utf8")`, `writeFile`, `mkdir`, `readdir(p, { withFileTypes: true })`, `stat`, `chmod`, `rm(p, { recursive: true })`, `mkdtemp(join(tmpdir(), "devkit-"))`) |
| `e instanceof Deno.errors.NotFound` | `(e as NodeJS.ErrnoException).code === "ENOENT"` |
| `Deno.build.os === "windows"` | `process.platform === "win32"` |
| `Deno.args` / `Deno.exit` | `process.argv.slice(2)` / `process.exit` |
| `new Deno.Command(cmd, {args}).output()` | `execFile` / `spawn` from `node:child_process` (promisified) returning `{ code, stdout, stderr }` as strings |
| `Deno.execPath()` (in `lint-commits_test.ts`) | `process.execPath`, args `[SCRIPT, ...args]` (no `run`/permission flags) |
| `fromFileUrl`, `join`, `dirname` from `@std/path` | `fileURLToPath` from `node:url`; `join`, `dirname` from `node:path` |
| `Deno.test(name, fn)` | `test(name, fn)` from `bun:test` |
| `assertEquals(a, b, msg?)` | `expect(a, msg).toEqual(b)` |
| `assertStringIncludes(s, x)` / `assertMatch(s, re)` | `expect(s).toContain(x)` / `expect(s).toMatch(re)` |
| `assertThrows(fn)` / `assertRejects(fn)` | `expect(fn).toThrow()` / `await expect(fn()).rejects.toThrow()` |

- [ ] **Step 1: Write the new failing test** in `scripts/lib/render-primer_test.ts`:

```ts
test("renderPrimer output is a Prettier fixed point", async () => {
  const [file] = await renderPrimer(SKILLS, "using-devkit");
  const filepath = join(SKILLS, "using-devkit", "SKILL.md");
  const options = { ...(await prettier.resolveConfig(filepath)), filepath };
  expect(await prettier.format(file.content, options)).toBe(file.content);
});
```

- [ ] **Step 2:** Port all 32 files per the table. Keep all 80 test names and every assertion 1:1. Update the error string in `generate.ts` to "Run `mise run generate` to regenerate." Update comments in `render-primer.ts`, `rasterize.ts` and `render-release.ts` that mention `deno`.
- [ ] **Step 3:** Run `mise exec -- bun test ./scripts`. Expected: 81 pass, 0 fail. The drift test (`committed files match the generator output`) may fail only on `skills/using-devkit/SKILL.md`, if Prettier's defaults differ from `deno fmt`. That is fixed in Task 5. Note it, don't hand-edit.
- [ ] **Step 4:** Run `mise exec -- tsc -p scripts`. Expected: exit 0.
- [ ] **Step 5:** Run `grep -rnE "Deno\.|@std/|jsr:|npm:|Bun\." scripts --include=*.ts | grep -v "^scripts/templates/"`. Expected: no output.
- [ ] **Step 6:** Commit (`--no-verify`): `build: port scripts and tests from deno to node APIs on bun`.

---

### Task 4: Formatter, linter, tasks; remove Deno

**Files:**
- Create: `.prettierrc.json`, `.prettierignore`, `.oxlintrc.json`, `scripts/format_test.ts`
- Modify: `mise.toml` (remove `deno` from `[tools]`; rewrite every task; replace the header comment)
- Delete: `deno.json`, `deno.lock`

**Interfaces:**
- Consumes: Task 3's `renderAll(config)` from `scripts/lib/render.ts`.
- Produces: the mise tasks below, used by CI and pre-commit unchanged.

| Task | `run` |
| --- | --- |
| `generate` | `bun scripts/generate.ts` |
| `check` | `bun scripts/generate.ts --check` |
| `test` | `bun test ./scripts` |
| `rasterize` | `bun scripts/rasterize.ts` |
| `fmt` | `prettier --write .` then `mise run generate` |
| `fmt-check` | `prettier --check .` |
| `lint` | `oxlint` |
| `lint-workflows` | `actionlint` |
| `typecheck` | `tsc -p scripts` |
| `validate-manifests` | `bun scripts/validate-manifests.ts` |
| `lint-skills` | `bun scripts/lint-skills.ts` |
| `lint-commits` | `bun scripts/lint-commits.ts` (args pass through) |
| `eval-triggers` / `eval-behavior` | the existing `claude plugin eval …` commands from `deno.json`, verbatim |
| `release` | fmt-check → lint → lint-workflows → typecheck → check → validate-manifests → lint-skills → test, sequential, fail-fast |

Every task that runs `bun`/`prettier`/`oxlint`/`tsc` gets `depends = ["deps"]`. Keep the existing explanatory comments above `lint-commits`, the eval tasks and `release`.

- [ ] **Step 1: Write the failing tests** in `scripts/format_test.ts`:

```ts
test("skill frontmatter is a Prettier fixed point", async () => {
  // for each skills/*/SKILL.md: format with resolved config; the text up to and
  // including the closing `---` line must be byte-identical to the input's.
});

test("every generated file is Prettier-ignored or a Prettier fixed point", async () => {
  // for each f of await renderAll(config): if (await prettier.getFileInfo(abs,
  // { ignorePath: <root>/.prettierignore })).ignored, skip; else
  // expect(await prettier.format(f.content, { ...resolved, filepath: abs })).toBe(f.content)
});
```

- [ ] **Step 2:** Run `mise exec -- bun test scripts/format_test.ts`. Expected: FAIL. The generated JSON manifests reformat (arrays collapse), and probably skill frontmatter too, with no config yet.
- [ ] **Step 3:** Write `.prettierrc.json` with an `overrides` entry for `skills/**/*.md`: `proseWrap: "preserve"`, `embeddedLanguageFormatting: "off"`. Write `.prettierignore` with the Global Constraints list. The generated JSON manifests are: `package.json`, `gemini-extension.json`, `release-please-config.json`, `.claude-plugin/`, `.codex-plugin/`, `.cursor-plugin/`, `.kimi-plugin/`, `hooks/*.json`. Take the authoritative list from `renderAll` output paths ending in `.json`. Write `.oxlintrc.json` with `ignorePatterns`.
- [ ] **Step 4:** Run `mise exec -- bun test scripts/format_test.ts`. Expected: PASS. If frontmatter still changes, fix the config, not the skills.
- [ ] **Step 5:** Rewrite `mise.toml` tasks per the table. Remove `deno` from `[tools]`. Replace the "delegate to `deno task`" header comment with one saying commands live here, in one place. Delete `deno.json` and `deno.lock`.
- [ ] **Step 6:** Run `mise run lint && mise run typecheck && mise run check && mise run validate-manifests && mise run lint-skills && mise run test`. Expected: all pass except possibly `check`/drift on files Task 5 reformats. `mise run fmt-check` is expected to FAIL here.
- [ ] **Step 7:** Commit (`--no-verify`): `build: replace deno fmt/lint/check/task with prettier, oxlint, tsc and mise tasks`.

---

### Task 5: One-time reformat

**Files:** whatever `prettier --write .` touches (formatting only).

- [ ] **Step 1:** Record frontmatter: `for f in skills/*/SKILL.md; do awk '/^---$/{n++} {print} n==2{exit}' "$f"; done > "$SCRATCH/fm-before.txt"`, where `$SCRATCH` is a temp dir outside the repo.
- [ ] **Step 2:** Run `mise run fmt`.
- [ ] **Step 3:** Repeat Step 1 into `fm-after.txt`; `diff` the two. Expected: no output.
- [ ] **Step 4:** Run `git diff --stat -- docs/superpowers evals`. Expected: empty.
- [ ] **Step 5:** Run `git diff --ignore-all-space --stat`. Review it: only whitespace, wrapping, quotes, trailing commas and other formatter changes, with no logic.
- [ ] **Step 6:** Run `mise run release`. Expected: all steps pass.
- [ ] **Step 7:** Commit normally (hook runs): `style: reformat tree with prettier`.

---

### Task 6: Docs and end-to-end verification

**Files:**
- Modify: `README.md:78-82,111`, `RELEASING.md:19`, `assets/README.md:10-13`

- [ ] **Step 1:** README Development section: tasks are defined directly in `mise.toml`. `mise install` gets bun + node; dependencies install automatically on first task. `scripts/` is a "TypeScript generator run with Bun". RELEASING: `mise run check`. assets/README: resvg is pinned in `scripts/bun.lock`, and the command is `mise run rasterize`.
- [ ] **Step 2:** Run `grep -rn -i deno . --exclude-dir=.git --exclude-dir=node_modules | grep -vE '^\./(skills|evals|docs/superpowers)/'`. Expected: no output, apart from `CHANGELOG.md` history lines if any.
- [ ] **Step 3: Clean-environment gate.** Run `mise uninstall deno --all; rm -rf scripts/node_modules; mise install && mise run release`. Expected: passes, deps install via the `deps` task, and no Deno is invoked.
- [ ] **Step 4:** Run `mise run fmt && git diff --exit-code`. Expected: exit 0 (generate and fmt agree).
- [ ] **Step 5:** Run `mise run rasterize && git diff --exit-code assets/app-icon.png`. Expected: exit 0. If bytes differ, keep the old PNG, open it and the new one side by side, and report back rather than committing.
- [ ] **Step 6:** Commit normally: `docs: describe bun-based tooling`.
- [ ] **Step 7:** Run `mise run lint-commits -- main`. Expected: 0 problems.
