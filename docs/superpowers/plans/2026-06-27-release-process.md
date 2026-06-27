# Release Process Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a git-native release process to `devkit`: release-please reads the existing conventional commits, keeps a release PR open, and on merge tags `vX.Y.Z` + cuts a GitHub Release + updates `CHANGELOG.md`.

**Architecture:** release-please runs in a new GitHub Actions workflow in manifest mode. The canonical version stays single-sourced in `marketplace.config.ts`; `scripts/generate.ts` additionally generates `release-please-config.json`, whose `extra-files` list tells release-please to bump all 8 version-bearing files (7 generated manifests + the TS source) to the same value in each release PR. Because every file moves together, the repo's existing drift check (`deno task check`) stays green and acts as the consistency proof. No external registry publishing.

**Tech Stack:** Deno 2.1.4 (generator + tests), `googleapis/release-please-action@v4`, GitHub Actions, conventional commits.

## Global Constraints

- **Single source of truth:** the version lives in `marketplace.config.ts`; all manifests are generated. Never hand-edit generated files — change the config (or a template) and regenerate. Copied verbatim from README: "**Never hand-edit generated files**".
- **The gate must stay green:** `deno task ci` = `fmt-check && lint && typecheck && check && validate-manifests && lint-skills && test`. Every task ends with this passing (except Task 4, which is a git operation).
- **Generated JSON is produced by `JSON.stringify(obj, null, 2) + "\n"`** and must also be `deno fmt`-clean (both run in the gate).
- **Conventional commits** for every commit in this plan (the release process itself depends on them).
- **Git-native only:** no npm/JSR/registry publish steps. Releases are tag + GitHub Release + CHANGELOG.
- **Pre-1.0 versioning:** `feat`→minor, `fix`/`perf`→patch, breaking→minor (`bump-minor-pre-major`). `1.0.0` is cut manually.

---

## File Structure

- `scripts/lib/render-release.ts` *(new)* — renders `release-please-config.json` from a static structure. One responsibility: the release-please config content.
- `scripts/lib/render-release_test.ts` *(new)* — unit tests for the renderer.
- `scripts/lib/render.ts` *(modify)* — wire `renderReleaseConfig()` into `renderAll()`.
- `scripts/lib/validate/validate.ts` *(modify)* — map the new manifest to a schema so coverage stays green.
- `scripts/lib/validate/schemas/release-please-config.json` *(new)* — minimal structural schema for the generated config.
- `release-please-config.json` *(new, generated)* — release-please config (do not hand-edit).
- `marketplace.config.ts` *(modify)* — annotate the `version:` line for release-please's generic updater.
- `.release-please-manifest.json` *(new, bot-maintained)* — release-please's version record, bootstrapped to `0.1.0`.
- `.github/workflows/release.yml` *(new)* — runs release-please on push to `main`.
- `deno.json` *(modify)* — exclude bot-written `CHANGELOG.md` + `.release-please-manifest.json` from `deno fmt`.
- `RELEASING.md` *(new)* + `README.md` *(modify)* — human guide.

---

### Task 1: Generate & validate `release-please-config.json`

This task makes `generate.ts` emit a release-please config, validates it through the existing manifest pipeline, and annotates the version source. End state: `deno task ci` green with the new generated file in the tree.

**Files:**
- Create: `scripts/lib/render-release.ts`
- Create: `scripts/lib/render-release_test.ts`
- Create: `scripts/lib/validate/schemas/release-please-config.json`
- Modify: `scripts/lib/render.ts`
- Modify: `scripts/lib/validate/validate.ts:7-18` (the `MANIFEST_SCHEMAS` map)
- Modify: `marketplace.config.ts:10` (the `version:` line)
- Generated (by running the task): `release-please-config.json`

**Interfaces:**
- Produces: `renderReleaseConfig(): GeneratedFile[]` — returns exactly one file at path `release-please-config.json`. `GeneratedFile` is `{ path: string; content: string }` (from `scripts/lib/types.ts`).
- Consumes: nothing from other tasks.

- [ ] **Step 1: Write the failing renderer test**

Create `scripts/lib/render-release_test.ts`:

```ts
import { assertEquals } from "@std/assert";
import { renderReleaseConfig } from "./render-release.ts";

function parsed() {
  const files = renderReleaseConfig();
  assertEquals(files.length, 1);
  assertEquals(files[0].path, "release-please-config.json");
  return JSON.parse(files[0].content);
}

Deno.test("release config lists all 8 version-bearing files", () => {
  const extra = parsed().packages["."]["extra-files"];
  assertEquals(extra.length, 8);
  const paths = extra.map((e: { path: string }) => e.path).sort();
  assertEquals(paths, [
    ".claude-plugin/marketplace.json",
    ".claude-plugin/plugin.json",
    ".codex-plugin/plugin.json",
    ".cursor-plugin/plugin.json",
    ".kimi-plugin/plugin.json",
    "gemini-extension.json",
    "marketplace.config.ts",
    "package.json",
  ]);
});

Deno.test("marketplace.json updates the nested plugins[0].version", () => {
  const extra = parsed().packages["."]["extra-files"];
  const mkt = extra.find((e: { path: string }) =>
    e.path === ".claude-plugin/marketplace.json"
  );
  assertEquals(mkt.jsonpath, "$.plugins[0].version");
});

Deno.test("marketplace.config.ts uses the generic updater", () => {
  const extra = parsed().packages["."]["extra-files"];
  const ts = extra.find((e: { path: string }) =>
    e.path === "marketplace.config.ts"
  );
  assertEquals(ts.type, "generic");
});

Deno.test("release config carries no _generated marker", () => {
  // release-please schema-validates this file and rejects unknown root keys,
  // so the usual generated marker must be absent.
  assertEquals("_generated" in parsed(), false);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `deno test --allow-read --allow-write scripts/lib/render-release_test.ts`
Expected: FAIL — `Module not found "./render-release.ts"`.

- [ ] **Step 3: Implement the renderer**

Create `scripts/lib/render-release.ts`:

```ts
import type { GeneratedFile } from "./types.ts";

// release-please consumes and schema-validates this config itself, and rejects
// unknown root keys — so unlike the per-harness manifests it deliberately does
// NOT carry a `_generated` marker. It stays single-sourced here; the drift
// check (`deno task check`) guards it against hand edits.
const CONFIG = {
  $schema:
    "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "simple",
  "bump-minor-pre-major": true,
  "bump-patch-for-minor-pre-major": false,
  "include-component-in-tag": false,
  "tag-separator": "-",
  "changelog-sections": [
    { type: "feat", section: "Features" },
    { type: "fix", section: "Bug Fixes" },
    { type: "perf", section: "Performance" },
    { type: "refactor", section: "Refactors" },
    { type: "docs", section: "Documentation" },
    { type: "chore", section: "Chores", hidden: true },
    { type: "test", section: "Tests", hidden: true },
    { type: "ci", section: "Continuous Integration", hidden: true },
    { type: "build", section: "Build System", hidden: true },
    { type: "style", section: "Styles", hidden: true },
  ],
  packages: {
    ".": {
      "extra-files": [
        { type: "json", path: "package.json", jsonpath: "$.version" },
        { type: "json", path: "gemini-extension.json", jsonpath: "$.version" },
        {
          type: "json",
          path: ".claude-plugin/plugin.json",
          jsonpath: "$.version",
        },
        {
          type: "json",
          path: ".claude-plugin/marketplace.json",
          jsonpath: "$.plugins[0].version",
        },
        {
          type: "json",
          path: ".codex-plugin/plugin.json",
          jsonpath: "$.version",
        },
        {
          type: "json",
          path: ".cursor-plugin/plugin.json",
          jsonpath: "$.version",
        },
        {
          type: "json",
          path: ".kimi-plugin/plugin.json",
          jsonpath: "$.version",
        },
        { type: "generic", path: "marketplace.config.ts" },
      ],
    },
  },
};

export function renderReleaseConfig(): GeneratedFile[] {
  return [{
    path: "release-please-config.json",
    content: JSON.stringify(CONFIG, null, 2) + "\n",
  }];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `deno test --allow-read --allow-write scripts/lib/render-release_test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Wire the renderer into `renderAll`**

In `scripts/lib/render.ts`, add the import and include the renderer:

```ts
import type { GeneratedFile, MarketplaceConfig } from "./types.ts";
import { renderJson } from "./render-json.ts";
import { renderReleaseConfig } from "./render-release.ts";
import { renderTemplated } from "./render-templated.ts";

const TEMPLATES_DIR = new URL("../templates", import.meta.url).pathname;

export async function renderAll(
  config: MarketplaceConfig,
): Promise<GeneratedFile[]> {
  return [
    ...renderJson(config),
    ...renderReleaseConfig(),
    ...(await renderTemplated(config, TEMPLATES_DIR)),
  ];
}
```

- [ ] **Step 6: Add the validation schema**

Create `scripts/lib/validate/schemas/release-please-config.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["packages"],
  "properties": {
    "packages": {
      "type": "object",
      "required": ["."],
      "properties": {
        ".": {
          "type": "object",
          "required": ["extra-files"],
          "properties": {
            "extra-files": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "object",
                "required": ["type", "path"],
                "properties": {
                  "type": { "type": "string" },
                  "path": { "type": "string" },
                  "jsonpath": { "type": "string" }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

- [ ] **Step 7: Map the manifest to its schema**

In `scripts/lib/validate/validate.ts`, add one entry to the `MANIFEST_SCHEMAS` map (after the `package.json` line):

```ts
  "package.json": "package",
  "release-please-config.json": "release-please-config",
  "hooks/hooks.json": "hooks",
```

(The map already contains the surrounding lines; insert the middle line. `checkCoverage` would otherwise report "no schema mapped" for the new file, and an orphan schema if the mapping were missing — both are now satisfied.)

- [ ] **Step 8: Annotate the version source for release-please's generic updater**

In `marketplace.config.ts`, change the `version` line (currently `    version: "0.1.0",`) to:

```ts
    version: "0.1.0", // x-release-please-version
```

This is a comment-only change: the rendered version value is unchanged, so no manifest drifts and `config_test.ts` (which asserts `0.1.0`) still passes.

- [ ] **Step 9: Generate the file and run the full gate**

Run:
```bash
deno task generate
deno task ci
```
Expected: `generate` writes the new `release-please-config.json` (file count increases by 1); `ci` ends with all checks passing — including `check` (drift: the new generated file now exists on disk and matches), `validate-manifests` (the new schema conforms), and `test` (including `render-release_test.ts` and the existing `validateAll: the real config's manifests all conform`).

- [ ] **Step 10: Commit**

```bash
git add scripts/lib/render-release.ts scripts/lib/render-release_test.ts \
  scripts/lib/render.ts scripts/lib/validate/validate.ts \
  scripts/lib/validate/schemas/release-please-config.json \
  release-please-config.json marketplace.config.ts
git commit -m "feat(release): generate release-please config from the single source"
```

---

### Task 2: Add the release workflow, bootstrap manifest, and fmt excludes

Wires release-please into CI and makes the repo tolerate the files release-please writes (`CHANGELOG.md`, `.release-please-manifest.json`), which are not `deno fmt`-shaped.

**Files:**
- Create: `.github/workflows/release.yml`
- Create: `.release-please-manifest.json`
- Modify: `deno.json` (the `fmt.exclude` array)

**Interfaces:**
- Consumes: `release-please-config.json` (from Task 1) as the workflow's `config-file`.
- Produces: nothing other tasks import.

- [ ] **Step 1: Create the bootstrap manifest**

Create `.release-please-manifest.json`:

```json
{
  ".": "0.1.0"
}
```

This records the current released version. release-please reads it to compute the next version and rewrites it on each release.

- [ ] **Step 2: Exclude bot-written files from `deno fmt`**

In `deno.json`, the `fmt.exclude` array currently lists `assets`, `.impeccable`, and several `references` dirs. Add the two bot-written paths at the top of the array:

```jsonc
  "fmt": {
    "exclude": [
      "CHANGELOG.md",
      ".release-please-manifest.json",
      "assets",
      ".impeccable",
      "skills/developer-environment/references",
      "skills/testing-practices/references",
      "skills/writing-clean-code/references",
      "skills/security-practices/references",
      "skills/navigable-codebases/references"
    ]
  }
```

Rationale: release-please writes Markdown and JSON in its own style; without excluding them, `deno task fmt-check` would fail on every release PR. (Do **not** exclude `release-please-config.json` — that one is generated canonically and must stay fmt-clean.)

- [ ] **Step 3: Create the release workflow**

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json
```

The default `GITHUB_TOKEN` suffices: there is no downstream publish workflow that a bot-created tag would need to trigger. `contents: write` lets it create tags/releases; `pull-requests: write` lets it maintain the release PR.

- [ ] **Step 4: Run the gate**

Run: `deno task ci`
Expected: PASS. The new files are inert to the generator (`.github/`, `.release-please-manifest.json` are not produced by `renderAll`, so no drift; the manifest is fmt-excluded). Confirm the manifest is valid JSON:

```bash
deno eval "JSON.parse(Deno.readTextFileSync('.release-please-manifest.json'))"
```
Expected: no output, exit 0.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/release.yml .release-please-manifest.json deno.json
git commit -m "feat(release): add release-please workflow + bootstrap manifest"
```

---

### Task 3: Document the release process

**Files:**
- Create: `RELEASING.md`
- Modify: `README.md` (insert a `## Releasing` section before `## License`, currently at line 106)

**Interfaces:** none.

- [ ] **Step 1: Write `RELEASING.md`**

Create `RELEASING.md`:

```markdown
# Releasing devkit

Releases are **git-native** and automated with
[release-please](https://github.com/googleapis/release-please). There is no
external registry publish — consumers pin to a git tag (`devkit@v0.2.0`) or
track `main`.

## How it works

1. Merge work to `main` using [Conventional Commits](https://www.conventionalcommits.org/)
   (`feat:`, `fix:`, `docs:`, etc.). CI runs the release gate on every PR.
2. The `release-please` workflow (`.github/workflows/release.yml`) keeps a
   **`chore(main): release X.Y.Z`** PR open, continuously updating
   `CHANGELOG.md` and bumping the version across every version-bearing file.
3. The CI drift check runs on that PR. Because release-please moves all files to
   the **same** version, `deno task check` stays green — that is the proof the
   bump is consistent.
4. **Merge the release PR** when you want to ship. release-please then tags
   `vX.Y.Z` and creates the GitHub Release.

## Versioning (pre-1.0)

- `feat:` → minor (`0.2.0`)
- `fix:` / `perf:` → patch (`0.1.1`)
- breaking change (`!` or `BREAKING CHANGE:`) → minor, flagged in the changelog
- Cut `1.0.0` manually when the suite is declared stable.

## The version is single-sourced

The canonical version lives in `marketplace.config.ts` (annotated with
`// x-release-please-version`). `scripts/generate.ts` generates
`release-please-config.json`, whose `extra-files` list is the set of files
release-please bumps. **To change which files carry the version, edit the
generator — never hand-edit `release-please-config.json`.**

## What `mise run release` is (not)

`mise run release` is the **quality gate** (fmt, lint, typecheck, drift, tests),
run in pre-commit and CI. It validates; it does not ship. Shipping is the
release-please flow above.
```

- [ ] **Step 2: Add a `## Releasing` section to the README**

In `README.md`, insert this section immediately before the `## License` line (currently line 106), after the `### Repo layout` list:

```markdown
## Releasing

Releases are git-native and automated with **release-please**. Merge
Conventional-Commit work to `main`; release-please maintains a release PR that
bumps the version and updates `CHANGELOG.md`. Merging that PR tags `vX.Y.Z` and
cuts a GitHub Release — consumers pin to the tag or track `main`. No external
registry is published. See [RELEASING.md](RELEASING.md) for details.

```

- [ ] **Step 3: Run fmt + gate**

Run:
```bash
deno task fmt-check
deno task ci
```
Expected: both PASS. (If `fmt-check` flags the new Markdown, run `deno task fmt` to normalize, then re-run — note `deno task fmt` also regenerates, which is a no-op here.)

- [ ] **Step 4: Commit**

```bash
git add RELEASING.md README.md
git commit -m "docs(release): document the release-please flow"
```

---

### Task 4: Bootstrap the `v0.1.0` baseline tag

A one-time git operation, run **after this branch merges to `main`**. It marks the current state as the `0.1.0` baseline so release-please computes the first real release from commits made *after* it (rather than restating all history).

**Files:** none (git refs only).

- [ ] **Step 1: Confirm you are on the merged `main`**

Run:
```bash
git checkout main && git pull
git rev-parse --abbrev-ref HEAD
```
Expected: `main`, up to date with origin including this plan's commits.

- [ ] **Step 2: Create and push the baseline tag**

Run:
```bash
git tag -a v0.1.0 -m "Baseline release before automated releasing"
git push origin v0.1.0
```
Expected: the tag appears on the remote. `git tag -l` now lists `v0.1.0`.

- [ ] **Step 3: Verify release-please picks up the baseline**

After the next push to `main`, open the Actions tab and confirm the `Release`
workflow ran. If commits since `v0.1.0` include a `feat`/`fix`, release-please
opens a `chore(main): release ...` PR. Confirm that PR bumps `marketplace.config.ts`
**and** all generated manifests to the same version and that its CI run is green.
(No code change here — this is the live end-to-end verification.)

---

## Self-Review

**Spec coverage:**
- Git-native release (tag + GitHub Release + CHANGELOG) → Task 2 (workflow), Task 4 (baseline). ✓
- release-please automation from conventional commits → Task 2. ✓
- A2 version fan-out, single-sourced + drift-guarded → Task 1 (generated config + schema + annotation). ✓
- Pre-1.0 versioning policy + changelog surfaces `docs`/`refactor` → Task 1 (`bump-minor-pre-major`, `changelog-sections`). ✓
- No external registry publishing → no publish step anywhere; stated in RELEASING.md (Task 3). ✓
- Testing via golden assertion + existing drift/validate guards → Task 1 (Steps 1-4, 9). ✓
- Bootstrap (`.release-please-manifest.json` at `0.1.0`, tag `v0.1.0`) → Task 2 Step 1, Task 4. ✓
- Bot-written files don't break the gate (a consequence not in the spec but required) → Task 2 Step 2 (fmt excludes). ✓

**Placeholder scan:** No TBD/TODO; every code/config step shows full content. ✓

**Type consistency:** `renderReleaseConfig(): GeneratedFile[]` is defined in Task 1 and consumed in Task 1 Step 5 with the same signature; `GeneratedFile` matches `scripts/lib/types.ts`. The `extra-files` paths in the renderer match the 8 paths asserted in the test and the manifests emitted by `renderJson`. ✓
