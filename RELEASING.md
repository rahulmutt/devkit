# Releasing devkit

Releases are **git-native** and automated with
[release-please](https://github.com/googleapis/release-please). There is no
external registry publish — consumers pin to a git tag (`devkit@v0.2.0`) or
track `main`.

## How it works

1. Merge work to `main` using
   [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`,
   `fix:`, `docs:`, etc.). CI runs the release gate on every PR.
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
