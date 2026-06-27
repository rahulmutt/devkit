# Release process for `devkit` — design

## Problem

`devkit` is a multi-harness skills marketplace consumed straight from this git
repo (claude, codex, cursor, gemini, kimi, pi, opencode). It has a solid
**quality gate** — `mise run release` → `deno task ci` runs fmt-check, lint,
typecheck, the generated-file drift check, manifest validation, skill lint, and
tests, enforced both in CI (`.github/workflows/ci.yml`) and a pre-commit hook.

But the `release` task's name oversells it: it _validates_, it never _ships_.
There is no actual release process. Concretely:

- No git tags (`git tag -l` is empty) — consumers cannot pin a version, only
  track `main`.
- No version-bump mechanism — the canonical `0.1.0` in `marketplace.config.ts`
  has never moved, and nothing automates moving it.
- No `CHANGELOG.md`, no GitHub Releases, no `RELEASING.md`.

The original marketplace design spec (`2026-06-24-devkit-marketplace-design.md`)
explicitly deferred external registry sync as "a possible future addition," so a
release process is the natural next step, not scope creep.

## Goal

Establish a **git-native release process** so that:

1. Each release produces a git **tag** (`vX.Y.Z`) that consumers can pin to, and
   a **GitHub Release** + **`CHANGELOG.md`** entry that documents what changed.
   (Releases serve a dual purpose: pinnable artifact _and_ human milestone.)
2. Releasing is **near-zero-manual**, driven by the conventional commits the
   repo already uses — via
   [release-please](https://github.com/googleapis/release-please).
3. The version stays **single-sourced** in `marketplace.config.ts` and the
   existing drift guard keeps the 7 generated manifests consistent at release
   time — preserving the repo's "one source of truth, machine-checked" ethos.

## Non-goals

- **External registry publishing** (npm / JSR / per-harness registries). Nothing
  consumes `devkit` as a package today; releases are git-native (tag + Release +
  changelog). The workflow stays structured so a publish step _could_ be added
  later, but none ships now.
- **Per-skill versioning.** The whole marketplace shares one version, as it does
  today.
- **Changing the existing CI quality gate or pre-commit hook.** They remain the
  per-PR/per-push validation and are reused, not replaced.
- **Automated `1.0.0` graduation.** Cutting `1.0.0` is a deliberate manual
  decision, made when the suite is declared stable.

## Design

### The core problem: version fan-out (decision A2)

The version lives in **one source** (`marketplace.config.ts`) and is fanned out
by `scripts/generate.ts` into 7 generated manifests (`package.json`,
`gemini-extension.json`, `.claude-plugin/{plugin,marketplace}.json`,
`.codex-plugin/plugin.json`, `.cursor-plugin/plugin.json`,
`.kimi-plugin/plugin.json`), all guarded by the drift check (`deno task check`).
release-please must bump the version without fighting that guard.

**Chosen approach — release-please updates every version-bearing file
declaratively, and the generator owns the list:**

- `scripts/generate.ts` additionally **generates `release-please-config.json`**,
  whose `extra-files` entries enumerate each manifest with a JSONPath to its
  version field (`$.version`, and `$.plugins[0].version` for the marketplace
  manifest), plus `marketplace.config.ts` as a generic-annotated file.
- `marketplace.config.ts` gets a `// x-release-please-version` annotation
  comment on its `version:` line so the TS source is updatable by
  release-please's generic updater.
- On a release, release-please bumps **all 8 version-bearing files to the same
  value** in the release PR. Because they all move together, the existing drift
  check stays green — and that green check is the **correctness proof** that the
  bump is consistent.

Why this over the alternative (release-please bumps only the source, CI
regenerates the manifests onto the PR branch): release-please force-pushes its
PR branch on each run, which races with any post-hoc regenerate commit. Having
release-please own every version file is **race-free**, and folding the
release-please config into `generate.ts` keeps the file list **single-sourced**
and drift-guarded — matching the repo's existing philosophy.

### Components

| # | Artifact                        | Status                                        | Purpose                                                                                                                               |
| - | ------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | `release-please-config.json`    | **generated** by `generate.ts`, drift-guarded | `extra-files` list (each manifest + JSONPath) + `marketplace.config.ts`; release-type config (versioning policy, changelog sections). |
| 2 | `.release-please-manifest.json` | committed, bot-maintained                     | release-please's record of the current version; bootstrapped to `0.1.0`.                                                              |
| 3 | `marketplace.config.ts`         | edited once                                   | `// x-release-please-version` annotation on the `version:` line.                                                                      |
| 4 | `.github/workflows/release.yml` | new                                           | Runs `googleapis/release-please-action` on push to `main`; maintains the release PR; on merge → tag + GitHub Release.                 |
| 5 | `CHANGELOG.md`                  | bot-maintained                                | Generated from conventional commits.                                                                                                  |
| 6 | `RELEASING.md` + README section | new                                           | Short human guide to the flow and how to cut/approve a release.                                                                       |

### Flow

1. Feature PRs merge to `main` as today (conventional commits, CI gate
   unchanged).
2. release-please keeps a **`chore(main): release X.Y.Z`** PR open, continuously
   updating `CHANGELOG.md` and bumping the version across all 8 files.
3. The existing **CI drift gate runs on that PR**; since every file moved to the
   same version, `deno task check` stays green, proving the bump is consistent.
4. Merging the release PR makes release-please **tag `vX.Y.Z`** and **create the
   GitHub Release**. Consumers pin to the tag; nothing pushes to external
   registries.

The workflow uses the default `GITHUB_TOKEN` — sufficient because there is no
downstream publish workflow that a bot-created tag would need to trigger.

### Versioning & changelog policy (pre-1.0)

Starting from `0.1.0`:

- `feat:` → **minor** (`0.2.0`)
- `fix:` / `perf:` → **patch** (`0.1.1`)
- breaking change (`!` / `BREAKING CHANGE:`) → **minor** pre-1.0
  (`bump-minor-pre-major: true`), surfaced with a "⚠ Breaking" changelog note
- `1.0.0` is cut **manually** when the suite is declared stable.

**Skills-repo tweak — the product is largely prose,** so a
`docs(testing-practices):` commit is often a real user-facing change. The
changelog **shows** `feat, fix, perf, refactor, docs` and **hides**
`chore, test, ci, build, style` (via `changelog-sections`). Tunable later.

### Testing

- `scripts/generate.ts` gets a golden assertion for the
  `release-please-config.json` output, mirroring the existing
  `scripts/lib/render-json_test.ts` pattern.
- The existing **drift check** (`deno task check`) and `validate-manifests` then
  guard the generated config on every PR — no new guard machinery needed.
- The full `deno task ci` continues to gate every PR, now including the
  release-please config in its drift coverage.

### Bootstrap (first release)

1. Seed `.release-please-manifest.json` at `0.1.0`.
2. Tag the current `HEAD` as **`v0.1.0`** as the baseline, so the first computed
   release (`0.1.1` / `0.2.0`, depending on commits made after it) is derived
   from history _after_ the baseline rather than restating everything to date.

## Open questions

None. Changelog visibility (surface `docs`/`refactor`) and the `v0.1.0` baseline
tag are settled per the decisions above.
