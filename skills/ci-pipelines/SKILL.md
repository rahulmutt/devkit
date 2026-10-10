---
name: ci-pipelines
description: Use when creating or editing CI workflows (.github/workflows, .gitlab-ci.yml, Buildkite pipelines), adding a nightly, scheduled, or cron job; when CI is slow, flaky, or fails only in CI; when pinning or updating GitHub Actions or setting up Renovate or Dependabot; or when configuring CI caching, required checks, branch protection, or workflow token permissions.
---

# CI Pipelines

A pipeline is pinned, fast, gated by one required check, and exercises its
scheduled jobs on every change. Syntax per platform:
[`references/github-actions.md`](references/github-actions.md).

## Principles — each with its counter-pull

### Pin everything the pipeline touches

Toolchain through mise (`developer-environment`); runner images by explicit
version (`ubuntu-24.04`, not `ubuntu-latest`). Every `uses:` line is
`@<40-char commit SHA> # vX.Y.Z`, never a tag, not even "until the updater pins
it". Current pins:

- `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`
- `jdx/mise-action@2d8d4cafcbd33be2ea37d2b6f5ad595363d1f1ca # v5.1.1` (caches
  the toolchain itself)

For any other action, resolve its SHA (`git ls-remote`) or leave it out. An
updater keeps the pins current: Renovate where mise is used (it also bumps
`mise.toml` and lockfiles), otherwise Dependabot. Counter-pull: a pin with no
updater just goes stale. Never pin without the automation that bumps it.

### Fast feedback

Cheapest checks first; caches keyed on lockfile and toolchain hashes; superseded
runs on the same branch cancelled. Counter-pull: a cache not keyed on its inputs
causes stale-cache bugs, which are worse than slowness.

### One required check

An aggregate gate job depends on every other job, and only it is required in
branch protection, so adding or renaming jobs never needs a settings change.
With a single job, that job is the gate. Don't add a wrapper. Counter-pull: path
filters on required jobs leave PRs waiting on checks that never ran; filter
inside the gate instead.

### Scheduled pipelines are exercised on every change

A nightly never runs on PRs, so a change that breaks it merges green. Give the
nightly a **smoke mode** (same workflow, same entry command, tiny budget: fuzz
for 30s, one matrix entry, one simulation seed) and run it in the PR pipeline,
feeding the gate. Lint the workflow files in the fast checks. Route scheduled
failures somewhere loud (an issue or channel). GitHub disables scheduled
workflows after 60 days without repository activity. Counter-pull: smoke mode
checks that the setup works, not the nightly's coverage. If it grows toward the
full run, it eats the PR time budget.

## Also

Never check out and run PR-head code under `pull_request_target` (it has secrets
and a write token). Same-command CI, token permissions, and CI-only failures:
see the reference.

## Boundaries with sibling skills

- Toolchain install and pinning → **`developer-environment`**.
- What runs in pre-commit / PR / nightly, and the PR time budget →
  **`testing-practices`**.
- Which scanners run, and secrets handling → **`security-practices`**.
- Exposing the gate as a named task → **`navigable-codebases`**.
