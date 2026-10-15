# release-please

Concrete forms of each `commits-and-releases` principle for
[release-please](https://github.com/googleapis/release-please). Verified against
its README on 2026-10-10.

## Commits

Subject: `type(scope): imperative summary`. Pick the type by the change's effect
on users: `feat` and `fix` bump the version and reach the release notes; `docs`,
`chore`, `refactor`, `test`, `ci` don't. A docs typo is `docs`, never `fix`. The
repo's allowed types are the `changelog-sections[].type` entries in
`release-please-config.json`.

One logical change per commit, each passing the gate, so it reverts cleanly and
maps to one changelog line. With squash merges, the PR title becomes the commit
subject. The body says why (the diff shows what) and references the issue
(`Refs #212`).

## Types and version bumps

| Commit                                | 1.x and later | Pre-1.0 with `bump-minor-pre-major: true`         |
| ------------------------------------- | ------------- | ------------------------------------------------- |
| `fix:` / `perf:`                      | patch         | patch                                             |
| `feat:`                               | minor         | minor (patch if `bump-patch-for-minor-pre-major`) |
| `type!:` or `BREAKING CHANGE:` footer | major         | minor                                             |
| `docs:`, `chore:`, `test:`, `ci:`, …  | none          | none                                              |

Which types appear in the changelog comes from `changelog-sections` in
`release-please-config.json`. Hidden sections still parse, but they don't
produce a release on their own.

## Breaking changes

```text
feat(cli)!: remove the --legacy flag

The legacy output format was deprecated in 1.0 and blocks the new renderer.

BREAKING CHANGE: `--legacy` is gone; use `--format=v1` for the old layout.
Refs #212
```

## Fixing the input, not the output

Force the next version with a `Release-As` footer in any commit body on the
default branch:

```bash
git commit --allow-empty -m "chore: release 2.0.0" -m "Release-As: 2.0.0"
```

To fix a mistyped commit in a **squash-merged** PR, edit the merged PR's body:

```text
BEGIN_COMMIT_OVERRIDE
feat: add CSV export
END_COMMIT_OVERRIDE
```

release-please uses this the next time it runs.

> **Plain merge commits ignore the override.** release-please can't tell which
> commit the override applies to. Add a new commit with the correct type
> instead, e.g. `git commit --allow-empty -m "feat: add --json output flag"`.

Never force-push a shared branch to reword a merged commit. Rebasing your own
unmerged branch is fine.

## Shipping

Prepare the release; don't merge the release PR, push tags, or publish unless
the human asked. Those steps are outward-facing and hard to undo.

## Bootstrapping

Before the first automated release, tag the baseline so release-please doesn't
restate all history:

```bash
git tag -a v0.1.0 -m "Baseline release before automated releasing"
```

Cut `1.0.0` deliberately, with `Release-As: 1.0.0`.

## One source for the version

List every file that carries the version in `extra-files`. For files with no
structured format, annotate the line:

```ts
export const version = "0.3.0"; // x-release-please-version
```

## When to use something else

Follow what the repo already uses:

- **semantic-release:** publishes on every merge, with no release PR. The same
  commit grammar applies.
- **changesets:** common in JS monorepos. Each PR adds a `.changeset/*.md` file
  that names the bump per package. Write the changeset; don't hand-edit
  versions.
