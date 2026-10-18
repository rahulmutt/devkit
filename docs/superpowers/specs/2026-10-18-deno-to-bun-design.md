# Move repo tooling from Deno to Bun

**Date:** 2026-10-18 **Status:** Draft (awaiting owner review)

## Why

Deno is being deprecated (owner's source: Cloudflare and Deno announcements).
The repo's own tooling — the manifest generator, linters, validators, tests and
the release gate — runs entirely on Deno. It needs a runtime with a future. The
owner chose **Bun**. Separately, Node is bumped to the latest 26.x.

## Goals

- `mise run release` passes on Bun with **no Deno installed**.
- Every existing `mise run <task>` name keeps working with the same meaning, so
  CI (`mise run release`, `mise run lint-commits`), the pre-commit hook and
  muscle memory are unaffected.
- The generator produces the same manifests as today (only differences: the
  one-time reformat below).
- Node pinned at `26.12.0` (already in the working tree, uncommitted).

## Non-goals

- Rewriting in another language. Code stays TypeScript.
- Editing Deno mentions in skill content, references or evals
  (`skills/developer-environment/**`, `skills/ci-pipelines/references/**`,
  `evals/ci-add-*/**`). Those describe *users'* projects, not this repo.
- Rewriting historical docs under `docs/superpowers/` (specs, plans, reviews,
  handoffs). They are history.
- Changing CI workflow files beyond what is strictly necessary (expected: none,
  since CI only calls mise).

## Anti-goals

- Re-locking the code to one runtime. Don't swap `Deno.*` for `Bun.*`.
- Commands duplicated in two places (the old `mise.toml` comment insisted on one
  source of truth; keep that spirit).
- Hand edits to generated files, or the generated `package.json` gaining
  content that the drift check doesn't own.

## Decisions

| Area                | Decision                                                                                                                                                                     | Whose  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Runtime             | Bun, exact version pinned in `mise.toml` (`mise use --pin bun@<latest>`; 1.4.3 at time of writing). `deno` removed from `[tools]`.                                           | Owner  |
| Node                | `26.12.0`, stays in `[tools]`.                                                                                                                                               | Owner  |
| Language            | TypeScript, run directly by Bun.                                                                                                                                             | Owner  |
| Runtime portability | Bar is "no `Bun.*` calls in scripts"; running them under Node is not required or verified. Node stays in `[tools]` regardless. | Claude |
| Runtime APIs        | `Deno.*` → Node built-ins (`node:fs/promises`, `node:path`, `node:child_process`, `node:os`, `process.argv`/`process.exit`, `import.meta.dirname`). Bun supports all of these. | Claude |
| `@std/path`         | Replaced by `node:path` / `node:url` (`fileURLToPath`).                                                                                                                      | Claude |
| Tests               | `bun test`. 80 `Deno.test` blocks → `test(...)` from `bun:test`; `@std/assert` → `expect(...)`. Keep test names and coverage 1:1 — this is a port, not a rewrite.            | Claude |
| Formatter           | Prettier, with the same exclusions as `deno.json` `fmt.exclude`, **plus** `docs/superpowers/**` and `evals/**` (history / out of scope). Formats TS, JSON, YAML and markdown (deno fmt did markdown too). | Claude |
| Skill markdown      | `skills/**` is formatted cautiously: `proseWrap: "preserve"` (no rewrapping) and frontmatter must come out byte-identical — especially the one-line `description:` that harnesses parse. Verify with a diff of every SKILL.md's frontmatter before/after. | Owner  |
| Reformat            | Accept Prettier's output; one formatting-only commit, separate from logic changes. No attempt to mimic `deno fmt` style beyond obvious settings. Markdown outside `skills/` may be rewrapped; inside `skills/`, see the "Skill markdown" row. | Owner  |
| Linter              | oxlint, ignoring the same paths as `deno.json` `lint.exclude` (foreign-runtime extension code).                                                                              | Claude |
| Typecheck           | `tsc --noEmit` over the same entry points as today's `deno check` (plus tests is fine).                                                                                     | Claude |
| Task definitions    | Commands live directly in `mise.toml` `[tasks.*].run`. `deno.json` and `deno.lock` deleted. `ci`/`release` composes other tasks via mise `depends` or sequential `run` lines. | Claude |
| JS dependencies     | A hand-maintained, `"private": true` **`scripts/package.json`** with `bun.lock` beside it, holding devDeps (prettier, oxlint, typescript, `@types/bun`/`@types/node`, `@cfworker/json-schema`, `@resvg/resvg-js@2.6.2`). The root `package.json` stays generator-owned and untouched. Scripts under `scripts/` resolve `scripts/node_modules` naturally; tasks call binaries from there. A `mise run install`/`setup` step or a dependency on `bun install --frozen-lockfile` makes fresh clones and CI work. | Claude |
| Primer formatting   | `scripts/lib/render-primer.ts` runs Prettier (programmatic API preferred over spawning) instead of `deno fmt`, so generated output equals formatted output and `check` stays stable after `fmt`. | Claude |
| Subprocesses        | Code that spawns `deno` (render-primer, tests using `Deno.execPath()`, validate-manifests) spawns the equivalent Bun/Prettier/git path instead.                                | Claude |
| Error messages      | Strings like "Run `deno task generate`" become "Run `mise run generate`".                                                                                                     | Claude |
| Docs                | Update `assets/README.md`, `README.md` (setup + tasks section, `scripts/` description), `RELEASING.md`, the comment block in `mise.toml`, and code comments that mention Deno.                    | Claude |
| `.gitignore`        | Already ignores `node_modules/`; confirm it covers `scripts/node_modules`.                                                                                                    | Claude |

## Commit shape (suggested)

1. `chore(deps): bump node to 26.12.0`
2. Port runtime APIs + tests to Bun; new task definitions; delete deno files.
3. `style:` one-time Prettier reformat of the tree (formatting only).
4. Docs updates.

*Claude's call:* commit 2 cannot pass `fmt-check` (the tree isn't
Prettier-formatted until commit 3), and the pre-commit hook runs the full gate.
Commit 2 is made with `--no-verify`, noted in its body; every other commit and
the branch as a whole must pass `mise run release`.

Conventional Commits are enforced by `mise run lint-commits`. Use `chore`/`build`
/`ci`/`style`/`docs` types — none of this is a user-facing `feat`/`fix`, so it
should not bump the plugin's version.

## Left to the builder

- Exact Prettier / oxlint / tsconfig settings, as long as the anti-goals hold.
  Generated JSON that release-please rewrites must not flip-flop with Prettier.
- Bun version: pick the newest that satisfies the repo's 14-day minimum release
  age.
- Whether `ci` is a mise `depends` chain or a single sequential script.
- How to make Bun's test runner find `*_test.ts` files (rename to `*.test.ts`,
  or configure `bunfig.toml`); renaming is fine.
- Order of the port within commit 2.

## Verification

- `mise uninstall deno` (or a clean environment without it), then
  `mise install && mise run release` passes.
- `mise run generate` on a clean tree after the reformat commit produces no
  diff; `mise run check` passes.
- `mise run rasterize` still produces `assets/app-icon.png` (resvg native module
  loads under Bun).
- `mise run lint-commits -- origin/main` passes on the new branch.
- `grep -rn -i deno` outside the non-goal paths returns nothing.
