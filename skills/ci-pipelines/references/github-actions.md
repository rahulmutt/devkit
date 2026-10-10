# GitHub Actions

Concrete forms of each `ci-pipelines` principle.

## Same command, pinned toolchain

```yaml
steps:
  - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
  - uses: jdx/mise-action@2d8d4cafcbd33be2ea37d2b6f5ad595363d1f1ca # v5.1.1 (installs mise.toml tools, caches them)
  - run: mise run release
```

Don't add `actions/setup-node`, `setup-python`, `denoland/setup-deno`, etc.
alongside mise. Two toolchain sources is the classic "passes locally, fails in
CI" bug.

## Pinning

- `uses: owner/action@<40-char commit sha> # vX.Y.Z`. Resolve a tag's SHA with
  `git ls-remote https://github.com/owner/action 'refs/tags/vX.Y.Z^{}'` (fall
  back to `refs/tags/vX.Y.Z` for lightweight tags).
- `runs-on: ubuntu-24.04` (never `ubuntu-latest`).
- Reusable workflows from another repo: also `@<sha> # vX.Y.Z`.

Renovate (preferred with mise; its `mise` manager bumps `mise.toml`):

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended", "helpers:pinGitHubActionDigests"],
  "minimumReleaseAge": "14 days"
}
```

Dependabot (actions and lockfiles; does not bump `mise.toml`):

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
```

## Least-privilege tokens

```yaml
permissions:
  contents: read # workflow default
jobs:
  release:
    permissions:
      contents: write # only the job that needs it
```

> **`pull_request_target` runs with secrets and a write token.** Never check out
> and execute the PR's head code under it. Use `pull_request` for anything that
> builds or tests contributor code.

## Fast feedback

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

Custom caches key on inputs:
`key: ${{ runner.os }}-${{ hashFiles('mise.toml', '**/*.lock') }}`.

## One required check

```yaml
gate:
  if: always()
  needs: [release, nightly-smoke]
  runs-on: ubuntu-24.04
  steps:
    - if: contains(needs.*.result, 'failure') || contains(needs.*.result, 'cancelled')
      run: exit 1
```

Mark only `gate` as required in branch protection.

## CI-only failures

Diff, in order: toolchain sources (any `setup-*` action next to mise?), runner
image, environment variables and secrets present, the exact command, and caches
(re-run without cache). Re-run with debug logging (`ACTIONS_STEP_DEBUG=true`),
or run locally with `act`.

## Nightly with smoke mode

```yaml
# .github/workflows/nightly.yml
name: Nightly
on:
  schedule: [{ cron: "0 3 * * *" }]
  workflow_dispatch:
  workflow_call:
    inputs:
      smoke: { type: boolean, default: false }
permissions:
  contents: read
jobs:
  nightly:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: jdx/mise-action@2d8d4cafcbd33be2ea37d2b6f5ad595363d1f1ca # v5.1.1
      - run: mise run nightly ${{ inputs.smoke && '--smoke' || '' }}
  report-failure:
    needs: nightly
    if: failure() && github.event_name == 'schedule'
    runs-on: ubuntu-24.04
    permissions:
      issues: write
    steps:
      - env:
          GH_TOKEN: ${{ github.token }}
          RUN_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
        run: gh issue create --repo "$GITHUB_REPOSITORY" --title "Nightly failed" --body "$RUN_URL"
```

```yaml
# in ci.yml (PR pipeline)
nightly-smoke:
  uses: ./.github/workflows/nightly.yml
  with: { smoke: true }
```

Add `nightly-smoke` to the gate's `needs`. The smoke budget lives in the
`nightly` task (`--smoke`), not in YAML. Lint workflows with `actionlint` in the
fast checks. GitHub disables scheduled workflows after 60 days without
repository activity, so a silent nightly may simply be off.
