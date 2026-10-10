# New skill: `ci-pipelines`

**Date:** 2026-10-10 **Status:** Approved (design)

## Problem

CI guidance is split across skills, and the mechanics of building a pipeline are
not covered anywhere. `testing-practices` decides which tests run in which tier
(pre-commit / PR / nightly) and sets the PR time budget. `security-practices`
decides which scanners run and where. `developer-environment` pins the
toolchain. None of them says how to build a pipeline: how CI invokes checks, how
actions and runners are pinned and kept current, what token permissions a
workflow gets, how caching and required checks are set up, or how to keep
scheduled (nightly) pipelines from breaking without anyone noticing. Agents
writing CI fall back on habits like `@v4` tags, `ubuntu-latest`, broad default
tokens, inline build logic in YAML, and nightly jobs no PR ever runs.

## Decisions

| Question                      | Decision                                                                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope                         | **Mechanics only.** What runs where stays in `testing-practices` / `security-practices`; this skill points to them.                                                 |
| Platform                      | **Platform-agnostic SKILL.md + per-platform references.** Ship `references/github-actions.md` only; GitLab/Buildkite later if needed.                               |
| Action pinning                | **Commit SHA + version comment** for every action, first-party included, kept current by an updater.                                                                |
| Updater                       | Skill names both: **Renovate** preferred where mise is used (covers `mise.toml`, actions, lockfiles); **Dependabot** acceptable otherwise. This repo uses Renovate. |
| Nightly / scheduled pipelines | In scope: every change runs the nightly in **smoke mode**, workflows are linted, and scheduled failures are routed somewhere loud.                                  |

Verified against Renovate docs (2026-10-10): the `mise` manager matches
`mise.toml`, reads `[tools]`, supports `deno` and `node`, and keeps concrete
versions concrete. The `helpers:pinGitHubActionDigests` preset pins actions to
SHAs and updates them from the version comment.

## Skill identity

- **Name:** `ci-pipelines`
- **Description:**

  > Use when creating or editing CI workflows (.github/workflows,
  > .gitlab-ci.yml, Buildkite pipelines), adding a nightly, scheduled, or cron
  > job; when CI is slow, flaky, or fails only in CI; when pinning or updating
  > GitHub Actions or setting up Renovate or Dependabot; or when configuring CI
  > caching, required checks, branch protection, or workflow token permissions.

  Trigger conditions only; must stay under the 500-character lint warning.

## Boundaries

| Concern                                         | Owner                   |
| ----------------------------------------------- | ----------------------- |
| Which tests run in which tier; PR time budget   | `testing-practices`     |
| Which scanners run; secrets handling in general | `security-practices`    |
| Installing/pinning the toolchain CI uses        | `developer-environment` |
| Exposing the gate as a named, discoverable task | `navigable-codebases`   |

`testing-practices` and `security-practices` each gain a one-line pointer to
`ci-pipelines` in their "Boundaries with sibling skills" section; their content
is unchanged. The `using-devkit` skill index picks the new skill up via the
generator.

## SKILL.md principles

Same "principle + counter-pull" format as `writing-clean-code` and
`navigable-codebases`. Target under 500 words; all syntax lives in the
reference.

1. **The pipeline calls the same command developers run.** CI invokes the repo's
   gate task (e.g. `mise run release`), not build or test logic in YAML, so a
   red CI is reproducible locally with one command. _Counter-pull:_ CI-only
   concerns (matrix, artifact upload, deploy credentials) stay in YAML.
2. **Pin everything the pipeline touches.** Toolchain via mise (delegated to
   `developer-environment`), actions by SHA + version comment, explicit runner
   images (`ubuntu-24.04`, not `-latest`). An updater keeps pins current.
   _Counter-pull:_ a pin with no updater just goes stale; never pin without the
   automation that bumps it.
3. **Least-privilege tokens.** Read-only workflow default, write granted per
   job; never expose secrets to fork-triggered runs. _Counter-pull:_ don't strip
   a permission a job needs and then work around it with a broader PAT.
4. **Fast feedback.** Cheap checks first, cache keyed on lockfile and toolchain
   hashes, cancel superseded runs on the same ref. What belongs in the blocking
   tier is `testing-practices`' call. _Counter-pull:_ a cache not keyed on its
   inputs causes stale-cache bugs, which are worse than slowness.
5. **One required check.** An aggregate gate job depends on every other job;
   only it is required in branch protection, so adding or renaming jobs never
   needs a settings change. _Counter-pull:_ path filters on required jobs leave
   PRs stuck waiting for checks that never ran; filter inside the gate. With a
   single job, that job is the gate. Don't add a wrapper.
6. **CI-only failures are differences in environment.** When CI fails but local
   passes, compare pins, env vars, and the command run before touching code. The
   fix is to pin the thing that differed, not to retry until it passes.
7. **Scheduled pipelines are exercised on every change.** A nightly doesn't run
   on PRs, so a change that breaks it merges green.
   - The nightly workflow has a **smoke mode** that the PR pipeline runs: same
     workflow, entry command, and setup at a tiny budget (fuzz for 30s, one
     matrix entry, a short DST seed run, mutation on one file). It feeds the
     gate.
   - **Lint workflow files** (e.g. `actionlint`) among the fast checks.
   - **Make scheduled failures loud**: route them to an issue or channel; add a
     manual trigger. Note GitHub's 60-day inactivity auto-disable of scheduled
     workflows.

   _Counter-pull:_ smoke mode checks that the setup works, not the nightly's
   coverage. If it creeps toward the full run it eats the PR time budget.

## `references/github-actions.md`

One short, copyable snippet per principle:

| # | GitHub Actions form                                                                                                                                                                                                                                                                                                      |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 | `jdx/mise-action` (toolchain + cache) then one `run: mise run <gate>` step.                                                                                                                                                                                                                                              |
| 2 | `uses: owner/action@<40-char sha> # vX.Y.Z`; `runs-on: ubuntu-24.04`; `renovate.json` with `config:recommended` + `helpers:pinGitHubActionDigests` + `minimumReleaseAge`; a Dependabot `github-actions` alternative.                                                                                                     |
| 3 | Workflow-level `permissions: contents: read`, per-job grants; a warning box on `pull_request_target` + PR-head checkout.                                                                                                                                                                                                 |
| 4 | `concurrency` keyed on workflow + ref with `cancel-in-progress` for PRs; cache keys from `hashFiles(...)`.                                                                                                                                                                                                               |
| 5 | `gate` job: `needs: [...]`, `if: always()`, fails if any need failed or was cancelled; only `gate` is required.                                                                                                                                                                                                          |
| 6 | Checklist: diff runner image / env / pins / command; reproduce with `act` or a debug re-run.                                                                                                                                                                                                                             |
| 7 | `nightly.yml` with `schedule` + `workflow_dispatch` + `workflow_call` (`smoke` boolean input); entry `mise run nightly [--smoke]`; failure-reporting job (`if: failure() && github.event_name == 'schedule'`, `issues: write`); PR workflow calls it with `smoke: true` and adds it to the gate's `needs`; `actionlint`. |

The smoke budget lives in the task runner, not YAML, so principle 1 holds.

**Out of scope:** self-hosted runners, deploy/release workflows (a future
`commits-and-releases` skill), OIDC cloud auth.

## Applying it to this repo

- `ci.yml`: SHA-pinned actions with version comments, `runs-on: ubuntu-24.04`,
  workflow-level `permissions: contents: read`, `concurrency` with
  cancel-in-progress on PRs. Its single `release-gate` job stays the required
  check; no wrapper gate job.
- `release.yml`: SHA-pinned.
- `actionlint` pinned via mise, run by a `lint-workflows` task inside
  `deno task ci`, so local and CI stay identical.
- `renovate.json`: `config:recommended`, `helpers:pinGitHubActionDigests`,
  `minimumReleaseAge: "14 days"`. **Owner action:** install the Renovate GitHub
  App on the repo.
- No nightly is added. devkit has none, and the obvious candidate (scheduled
  trigger evals) needs an API-key secret and nightly spend. Revisit if wanted.

## Testing (writing-skills RED → GREEN)

Run with `claude plugin eval` using the default with/without comparison, so
every run measures the no-skill baseline alongside the with-skill result.

1. **RED: behaviour cases** against a fixture repo (`mise.toml` + a `release`
   task, no CI), scored by LLM graders, run **before** the skill exists:
   - `ci-add-workflow`: "Add CI for this repo." Checks SHA pins + version
     comment, read-only permissions, calls `mise run release` rather than inline
     steps, explicit runner, updater config.
   - `ci-add-nightly`: "Add a nightly fuzz job." Checks smoke run on PRs feeding
     the gate, failure alerting, manual trigger.
   - `ci-only-failure`: "Tests pass locally but fail in CI." Checks that it
     compares the environment before changing code and adds no retry.

   **Any principle the baseline already satisfies is cut from the skill** rather
   than documented.
2. **GREEN:** write SKILL.md and the reference to address the observed failures;
   rerun until the with-skill arm passes.
3. **Trigger evals:** add `ci-edit-workflow`, `ci-pin-actions`,
   `ci-nightly-broke`; the existing 20 cases must still pass.
4. **Budget:** about $15–25 for behaviour evals and about $8 for the trigger
   rerun.

## Success criteria

- `mise run release` passes, including `lint-skills` (description under 500
  characters) and the new `lint-workflows`.
- Every behaviour case: the with-skill arm passes, and the with-skill score
  beats the baseline score on the criteria the skill addresses.
- All trigger cases fire, the new ones included.
- This repo's workflows satisfy principles 1–6 as written.
