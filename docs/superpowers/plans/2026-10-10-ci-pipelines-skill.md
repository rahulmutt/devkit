# ci-pipelines Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a `ci-pipelines` devkit skill (pipeline mechanics: same command
locally and in CI, SHA pinning plus an updater, least-privilege tokens, fast
feedback, one required check, CI-only failures, smoke-run nightlies), proven by
before/after evals, and bring devkit's own CI in line with it.

**Architecture:** Platform-agnostic `skills/ci-pipelines/SKILL.md` (principles
plus counter-pulls) with `references/github-actions.md` holding the syntax.
Behaviour evals in `evals/` (LLM graders, fixtures inlined in prompts) run
before the skill exists (RED) and after (GREEN). Trigger evals extend the
existing suite. The `using-devkit` skill index updates itself through
`deno task generate`.

**Tech Stack:** Markdown skills, Deno generator (`deno task generate`/`check`),
mise tasks, `claude plugin eval` (2.1.296), GitHub Actions, Renovate,
actionlint.

**Spec:** `docs/superpowers/specs/2026-10-10-ci-pipelines-design.md`

## Global Constraints

- Skill name `ci-pipelines`; directory `skills/ci-pipelines/`.
- Description, verbatim, 363 chars (lint warns over 500, errors over 1024):
  `Use when creating or editing CI workflows (.github/workflows, .gitlab-ci.yml, Buildkite pipelines), adding a nightly, scheduled, or cron job; when CI is slow, flaky, or fails only in CI; when pinning or updating GitHub Actions or setting up Renovate or Dependabot; or when configuring CI caching, required checks, branch protection, or workflow token permissions.`
- SKILL.md body under 500 words (`wc -w`); all YAML/JSON syntax goes in
  `references/github-actions.md`.
- The skill never gives install commands. Tool installation is delegated to
  `developer-environment`.
- Action pins (verified 2026-10-10):
  - `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`
  - `jdx/mise-action@2d8d4cafcbd33be2ea37d2b6f5ad595363d1f1ca # v5.1.1`
  - `googleapis/release-please-action@45996ed1f6d02564a971a2fa1b5860e934307cf7 # v5.0.0`
- actionlint `1.7.12`, pinned through mise.
- Never hand-edit generated files (`skills/using-devkit/SKILL.md` index region,
  manifests). Run `deno task generate`.
- `mise run release` must pass at the end of every task.
- Work on branch `feat/ci-pipelines-skill` (stacked on
  `chore/toolchain-and-skill-triggering`, PR #2).
- Eval spend: about $25 for behaviour evals and $8 for triggers. Stop and report
  if a single run's cost exceeds $15 (`--max-cost-usd 15`).

## File Structure

| Path                                                                          | Responsibility                                           |
| ----------------------------------------------------------------------------- | -------------------------------------------------------- |
| `evals/ci-add-workflow/`                                                      | Behaviour case: "add CI" (5 LLM graders)                 |
| `evals/ci-add-nightly/`                                                       | Behaviour case: "add a nightly fuzz job" (4 LLM graders) |
| `evals/ci-only-failure/`                                                      | Behaviour case: "fails only in CI" (1 LLM grader)        |
| `docs/superpowers/reviews/2026-10-10-ci-pipelines-evals.md`                   | RED/GREEN results and which principles were cut          |
| `skills/ci-pipelines/SKILL.md`                                                | Principles + counter-pulls, boundaries                   |
| `skills/ci-pipelines/references/github-actions.md`                            | Concrete GitHub Actions/Renovate/Dependabot syntax       |
| `skills/testing-practices/SKILL.md`                                           | One-line boundary pointer to ci-pipelines                |
| `skills/security-practices/SKILL.md`                                          | One-line boundary pointer to ci-pipelines                |
| `evals/ci-edit-workflow/`, `evals/ci-pin-actions/`, `evals/ci-nightly-broke/` | Trigger cases                                            |
| `.github/workflows/ci.yml`, `release.yml`                                     | SHA pins, explicit runner, permissions, concurrency      |
| `renovate.json`                                                               | Updater config                                           |
| `mise.toml`, `deno.json`                                                      | actionlint pin, `lint-workflows` + `eval-behavior` tasks |
| `README.md`                                                                   | Skill table row, task list                               |

---

### Task 1: Behaviour evals and RED baseline

**Files:**

- Create: `evals/ci-add-workflow/prompt.md`,
  `evals/ci-add-workflow/graders/{calls-gate,sha-pins,permissions,runner,updater}.md`
- Create: `evals/ci-add-nightly/prompt.md`,
  `evals/ci-add-nightly/graders/{smoke-on-pr,failure-alert,manual-trigger,entry-command}.md`
- Create: `evals/ci-only-failure/prompt.md`,
  `evals/ci-only-failure/graders/env-first.md`
- Create: `docs/superpowers/reviews/2026-10-10-ci-pipelines-evals.md`
- Modify: `deno.json` (add `eval-behavior` task), `mise.toml` (add
  `eval-behavior` task)

**Interfaces:**

- Produces: the case names `ci-add-workflow`, `ci-add-nightly`,
  `ci-only-failure`, tagged `behavior` and `ci-pipelines` (never `trigger`, so
  `eval-triggers` skips them); the task `mise run eval-behavior`.

- [ ] **Step 1: Write `evals/ci-add-workflow/prompt.md`**

```markdown
---
max_turns: 8
runs: 3
tags: [behavior, ci-pipelines]
allowed_tools: [Skill]
---

This GitHub-hosted repo has no CI yet. Its `mise.toml`:

    [tools]
    deno = "2.9.7"

    [tasks.release]
    description = "Release gate: fmt-check, lint, test"
    run = "deno task ci"

`deno.json` defines `"ci": "deno fmt --check && deno lint && deno test -A"`.

Add CI for this repo. Reply with the complete contents of every file you would
create or change. Don't ask questions; make reasonable choices.
```

- [ ] **Step 2: Write the five graders for `ci-add-workflow`**

`graders/calls-gate.md`:

```markdown
---
type: llm
---

PASS if the CI workflow's check step invokes the repo's gate task
(`mise run release`, or `deno task ci` after installing the toolchain via mise)
as a single command. FAIL if it re-implements the checks as separate inline
steps (e.g. its own `deno fmt --check`, `deno lint`, `deno test` steps) instead
of calling the task.
```

`graders/sha-pins.md`:

```markdown
---
type: llm
---

PASS if every `uses:` line in the proposed workflows references a full
40-character hexadecimal commit SHA followed by a version comment (e.g.
`@<sha> # v4.2.0`). Judge the format only, not whether the SHA is real. FAIL if
any `uses:` references a tag (`@v4`), branch (`@main`), or a SHA with no version
comment.
```

`graders/permissions.md`:

```markdown
---
type: llm
---

PASS if the workflow explicitly restricts the GITHUB_TOKEN to read-only
(`permissions: contents: read` or stricter) at the workflow or job level. FAIL
if `permissions` is absent or grants write access that the check job doesn't
need.
```

`graders/runner.md`:

```markdown
---
type: llm
---

PASS if every `runs-on` names an explicit image version (e.g. `ubuntu-24.04`).
FAIL if any `runs-on` uses a floating label such as `ubuntu-latest`.
```

`graders/updater.md`:

```markdown
---
type: llm
---

PASS if the reply adds an updater config (Renovate `renovate.json` or Dependabot
`.github/dependabot.yml`) that covers GitHub Actions. FAIL if no updater config
is proposed.
```

- [ ] **Step 3: Write `evals/ci-add-nightly/prompt.md`**

```markdown
---
max_turns: 8
runs: 3
tags: [behavior, ci-pipelines]
allowed_tools: [Skill]
---

This GitHub-hosted repo's `.github/workflows/ci.yml`:

    name: CI
    on:
      push: { branches: [main] }
      pull_request:
    jobs:
      release-gate:
        runs-on: ubuntu-24.04
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
          - uses: jdx/mise-action@2d8d4cafcbd33be2ea37d2b6f5ad595363d1f1ca # v5.1.1
          - run: mise run release

`mise.toml` has `[tasks.fuzz] run = "deno task fuzz"`, and `deno task fuzz`
accepts `--duration <seconds>`.

Add a nightly job that runs the fuzzer for an hour. Reply with the complete
contents of every file you would create or change. Don't ask questions.
```

- [ ] **Step 4: Write the four graders for `ci-add-nightly`**

`graders/smoke-on-pr.md`:

```markdown
---
type: llm
---

PASS if the change makes every PR (or push) also exercise the nightly path in a
reduced "smoke" mode: the same workflow or entry command with a short budget
(e.g. a fuzz duration of seconds), so a change that breaks the nightly setup
fails before merge. FAIL if the nightly only ever runs on its schedule or manual
trigger.
```

`graders/failure-alert.md`:

```markdown
---
type: llm
---

PASS if failures of the scheduled run are routed somewhere explicit (opening or
updating a GitHub issue, a chat/Slack notification, or similar). FAIL if it
relies on GitHub's default notifications or has no failure handling.
```

`graders/manual-trigger.md`:

```markdown
---
type: llm
---

PASS if the nightly workflow can be triggered manually (`workflow_dispatch`).
FAIL otherwise.
```

`graders/entry-command.md`:

```markdown
---
type: llm
---

PASS if the nightly runs the fuzzer through the repo's task (`mise run fuzz`,
passing the duration through) after installing the toolchain via mise. FAIL if
it calls `deno` directly or installs Deno with a separate setup action.
```

- [ ] **Step 5: Write `evals/ci-only-failure/prompt.md` and its grader**

`prompt.md`:

```markdown
---
max_turns: 8
runs: 3
tags: [behavior, ci-pipelines]
allowed_tools: [Skill]
---

Our tests pass locally, but in GitHub Actions `mise run release` fails with
`TypeError: Intl.Segmenter is not a constructor` in one test. Our ci.yml runs on
`ubuntu-latest`, uses `actions/setup-node@v4` with `node-version: 22`, and then
runs `mise run release`. Locally everyone uses mise, which pins
`node = "26.11.1"`. What should we do?
```

`graders/env-first.md`:

```markdown
---
type: llm
---

PASS if the reply's primary recommendation is to make CI use the same pinned
toolchain as local (e.g. drop `setup-node` and install via mise /
`jdx/mise-action`, so CI gets node 26.11.1), treating the failure as an
environment difference. FAIL if it leads with code changes (polyfills, feature
detection, skipping the test), retries, or simply bumping `node-version` in
`setup-node` while keeping two sources of truth.
```

- [ ] **Step 6: Add the `eval-behavior` task**

In `deno.json` `tasks`, after `eval-triggers`:

```json
"eval-behavior": "claude plugin eval . --tag behavior --no-publish",
```

In `mise.toml`, after the `[tasks.eval-triggers]` block:

```toml
[tasks.eval-behavior]
description = "Measure skill behaviour with vs. without devkit (evals/, costs API usage)"
run = "deno task eval-behavior"
```

- [ ] **Step 7: Run the RED baseline**

The skill doesn't exist yet, so the with-plugin arm is the baseline.

Run:
`claude plugin eval . --tag behavior --ablation none --trust-plugin --no-publish --max-cost-usd 15 --threshold 0 --json evals/results/red.json`

Expected: completes, writing `evals/results/red.json` (gitignored). Print
per-grader pass counts:

```bash
python3 -c "
import json; d = json.load(open('evals/results/red.json'))
for c in d['cases']:
    runs = c['arms']['with']
    for i, g in enumerate(runs[0]['graders']):
        print(f\"{c['name']:18} {g['name']:15} {sum(r['graders'][i]['passed'] for r in runs)}/{len(runs)}\")
"
```

- [ ] **Step 8: Record RED results and decide cuts**

Create `docs/superpowers/reviews/2026-10-10-ci-pipelines-evals.md`:

```markdown
# ci-pipelines evals

## RED (no skill), 3 runs per case

| Case                                      | Grader | Pass | Principle | Decision |
| ----------------------------------------- | ------ | ---- | --------- | -------- |
| <one row per grader from Step 7's output> |        |      |           |          |

Rule (from the spec): a grader the baseline passes 3/3 means that principle is
not taught by the skill. Mark it "cut" and drop it from SKILL.md in Task 2 (the
reference may keep its snippet).
```

Principle mapping: calls-gate → 1, sha-pins → 2, updater → 2, permissions → 3,
runner → 2, smoke-on-pr / failure-alert / manual-trigger → 7, entry-command → 1,
env-first → 6. Principles 4 and 5 have no grader; keep them (the spec has no
measurement for them).

- [ ] **Step 9: Verify and commit**

Run: `mise run release`. Expected: PASS (fmt-check covers the new markdown; run
`deno fmt` first if it fails).

```bash
git add evals/ci-add-workflow evals/ci-add-nightly evals/ci-only-failure deno.json mise.toml docs/superpowers/reviews/2026-10-10-ci-pipelines-evals.md
git commit -m "test(evals): add ci-pipelines behaviour evals and RED baseline"
```

---

### Task 2: Write the skill (GREEN)

**Files:**

- Create: `skills/ci-pipelines/SKILL.md`
- Create: `skills/ci-pipelines/references/github-actions.md`
- Modify: `skills/testing-practices/SKILL.md` ("Boundaries with sibling skills")
- Modify: `skills/security-practices/SKILL.md` ("Boundaries with sibling
  skills")
- Modify (generated): `skills/using-devkit/SKILL.md` via `deno task generate`
- Modify: `docs/superpowers/reviews/2026-10-10-ci-pipelines-evals.md`

**Interfaces:**

- Consumes: the RED table and cut decisions from Task 1.
- Produces: skill `ci-pipelines`, listed in the primer index as
  `**ci-pipelines**`.

- [ ] **Step 1: Write `skills/ci-pipelines/SKILL.md`**

Omit any principle marked "cut" in Task 1.

```markdown
---
name: ci-pipelines
description: Use when creating or editing CI workflows (.github/workflows, .gitlab-ci.yml, Buildkite pipelines), adding a nightly, scheduled, or cron job; when CI is slow, flaky, or fails only in CI; when pinning or updating GitHub Actions or setting up Renovate or Dependabot; or when configuring CI caching, required checks, branch protection, or workflow token permissions.
---

# CI Pipelines

A pipeline is a thin, pinned, least-privilege wrapper around the command
developers already run. Syntax per platform:
[`references/github-actions.md`](references/github-actions.md).

## Principles — each with its counter-pull

### The pipeline calls the same command developers run

CI invokes the repo's gate task (e.g. `mise run release`), not build or test
logic written into YAML, so every red build reproduces locally with one command.
Counter-pull: CI-only concerns (OS/version matrix, artifact upload, deploy
credentials) stay in the pipeline definition.

### Pin everything the pipeline touches

Toolchain through mise (`developer-environment`); every action or plugin by
commit SHA plus a version comment; runner images by explicit version
(`ubuntu-24.04`, not `ubuntu-latest`). An updater keeps the pins current:
Renovate where mise is used (it also bumps `mise.toml` and lockfiles), otherwise
Dependabot. Counter-pull: a pin with no updater just goes stale. Never pin
without the automation that bumps it.

### Least-privilege tokens

Default the workflow token to read-only and grant write access per job that
needs it. Never expose secrets to runs triggered from forks. Counter-pull: don't
strip a permission a job genuinely needs and then work around it with a broader
personal token.

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

### CI-only failures are differences in environment

When CI fails and local passes, compare pins, environment variables, runner
image, and the exact command before touching code. Pin whatever differed (often
a setup action alongside mise); don't retry or patch around it.

### Scheduled pipelines are exercised on every change

A nightly never runs on PRs, so a change that breaks it merges green. Give the
nightly a **smoke mode** (same workflow, same entry command, tiny budget: fuzz
for 30s, one matrix entry, one simulation seed) and run it in the PR pipeline,
feeding the gate. Lint the workflow files in the fast checks. Route scheduled
failures somewhere loud (an issue or channel), and add a manual trigger.
Counter-pull: smoke mode checks that the setup works, not the nightly's
coverage. If it grows toward the full run, it eats the PR time budget.

## Boundaries with sibling skills

- Toolchain install and pinning → **`developer-environment`**.
- What runs in pre-commit / PR / nightly, and the PR time budget →
  **`testing-practices`**.
- Which scanners run, and secrets handling → **`security-practices`**.
- Exposing the gate as a named task → **`navigable-codebases`**.
```

- [ ] **Step 2: Write `skills/ci-pipelines/references/github-actions.md`**

````markdown
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
````

- [ ] **Step 3: Add boundary pointers to sibling skills**

In `skills/testing-practices/SKILL.md`, under
`## Boundaries with sibling
skills`, append:

```markdown
- How the pipeline runs those tiers (pinning, caching, required checks,
  smoke-running nightlies on every change) → **`ci-pipelines`**.
```

In `skills/security-practices/SKILL.md`, under
`## Boundaries with sibling
skills`, append:

```markdown
- Workflow token permissions, action pinning, and where scanners sit in the
  pipeline → **`ci-pipelines`**.
```

- [ ] **Step 4: Regenerate and lint**

Run:
`deno task generate && deno task lint-skills && awk 'f>=2{print} /^---$/{f++}' skills/ci-pipelines/SKILL.md | wc -w`

Expected: `✓ all checks passed`; `skills/using-devkit/SKILL.md` now lists
`**ci-pipelines**`; the body word count (after the frontmatter) is under 500.

- [ ] **Step 5: Run the GREEN evals**

Run:
`claude plugin eval . --tag behavior --trust-plugin --no-publish --max-cost-usd 15 --threshold 0 --json evals/results/green.json`

(The default with/without comparison runs both arms.) Print per-grader pass
counts for both arms with Task 1 Step 7's script, using `green.json` and each of
`c['arms']['with']` and `c['arms']['without']`.

Expected: every non-cut grader passes ≥2/3 in the `with` arm and beats the
`without` arm or the RED count.

- [ ] **Step 6: If a grader still fails, tighten the wording and rerun**

Read the failing run's final message in the HTML report
(`evals/results/<timestamp>/report.html`). Classify the failure by
writing-skills' "Match the Form to the Failure" table (output with the wrong
shape → state what the output contains, as a recipe; a missing element → make it
a required item). Edit only the relevant principle and rerun just that case
(`--case <name>`). At most 2 iterations. If it still fails, record it as an open
issue in the review doc rather than piling on wording.

- [ ] **Step 7: Record GREEN results, verify, commit**

Append a `## GREEN (with skill)` table (case, grader, with, without) to
`docs/superpowers/reviews/2026-10-10-ci-pipelines-evals.md`, plus any wording
changes from Step 6.

Run: `deno fmt && mise run release`. Expected: PASS.

```bash
git add skills/ci-pipelines skills/testing-practices/SKILL.md skills/security-practices/SKILL.md skills/using-devkit/SKILL.md docs/superpowers/reviews/2026-10-10-ci-pipelines-evals.md
git commit -m "feat(skills): add ci-pipelines skill"
```

---

### Task 3: Trigger evals

**Files:**

- Create: `evals/ci-edit-workflow/`, `evals/ci-pin-actions/`,
  `evals/ci-nightly-broke/` (each `prompt.md` + `graders/skill-fired.md`)
- Modify: `evals/none-*/graders/no-devkit-skill.md` (add `ci-pipelines` to the
  alternation)

**Interfaces:**

- Consumes: skill name `ci-pipelines` from Task 2.

- [ ] **Step 1: Write the three trigger cases**

Each `prompt.md` uses this frontmatter, with only the tag `ci-pipelines` and the
prompt text varying:

```markdown
---
max_turns: 6
runs: 3
tags: [trigger, ci-pipelines]
allowed_tools: [Read, Glob, Grep, Skill]
---
```

Prompts:

- `ci-edit-workflow`:
  `Add a lint step to our GitHub Actions workflow so PRs fail on lint errors.`
- `ci-pin-actions`:
  `Our workflows use actions/checkout@v4 and friends. Lock those down properly.`
- `ci-nightly-broke`:
  `The nightly fuzz workflow has been failing for a week and nobody noticed. How do we stop that happening again?`

Each `graders/skill-fired.md`:

```markdown
---
type: tool_used
tool: Skill
input_match: '"skill"\s*:\s*"(?:[\w-]+:)?ci-pipelines"'
arm: both
---
```

- [ ] **Step 2: Extend the negative graders**

In each `evals/none-*/graders/no-devkit-skill.md`, change the `input_match`
alternation to include `ci-pipelines`:

```yaml
input_match: '"skill"\s*:\s*"(?:[\w-]+:)?(?:developer-environment|testing-practices|security-practices|writing-clean-code|navigable-codebases|ci-pipelines)"'
```

- [ ] **Step 3: Run the full trigger suite**

Run:
`mise run eval-triggers -- --trust-plugin --max-cost-usd 15 --threshold 0 --json evals/results/triggers.json`

Expected: 23 cases, 69/69 runs pass. If any of the original 20 regressed,
compare it with the last run in PR #2 (60/60) and fix the description that
overlaps before committing.

- [ ] **Step 4: Verify and commit**

Run: `deno fmt && mise run release`. Expected: PASS.

```bash
git add evals
git commit -m "test(evals): add ci-pipelines trigger cases"
```

---

### Task 4: Apply the skill to devkit's own CI

**Files:**

- Modify: `.github/workflows/ci.yml`, `.github/workflows/release.yml`
- Create: `renovate.json`
- Modify: `mise.toml` (actionlint pin, `lint-workflows` task), `deno.json`
  (`lint-workflows`, `ci` chain), `README.md`

- [ ] **Step 1: Pin actionlint**

Run: `mise use --pin actionlint@1.7.12 && actionlint --version`

Expected: `mise.toml` `[tools]` gains `actionlint = "1.7.12"`; the version
output starts with `1.7.12`.

- [ ] **Step 2: Wire `lint-workflows` into the gate and confirm it fails on a
      bad workflow**

In `deno.json` `tasks`, add `"lint-workflows": "actionlint",` and change `ci`
to:

```json
"ci": "deno task fmt-check && deno task lint && deno task lint-workflows && deno task typecheck && deno task check && deno task validate-manifests && deno task lint-skills && deno task test",
```

In `mise.toml`, before `[tasks.typecheck]`:

```toml
[tasks.lint-workflows]
description = "Lint GitHub Actions workflows (actionlint)"
run = "deno task lint-workflows"
```

Prove it can fail:
`printf 'on: push\njobs:\n  x:\n    runs-on: ubuntu-24.04\n    steps:\n      - run: echo ${{ github.nope }}\n' > .github/workflows/tmp-bad.yml && deno task lint-workflows; echo "exit=$?"; rm .github/workflows/tmp-bad.yml`

Expected: an actionlint error about `github.nope` and a non-zero exit.

- [ ] **Step 3: Rewrite `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  release-gate:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: jdx/mise-action@2d8d4cafcbd33be2ea37d2b6f5ad595363d1f1ca # v5.1.1
      - name: Release gate
        run: mise run release
```

- [ ] **Step 4: Pin `.github/workflows/release.yml`**

Change `runs-on: ubuntu-latest` to `runs-on: ubuntu-24.04` and the action line
to:

```yaml
- uses: googleapis/release-please-action@45996ed1f6d02564a971a2fa1b5860e934307cf7 # v5.0.0
```

Keep its existing `permissions` (contents/pull-requests write), which this job
needs.

- [ ] **Step 5: Add `renovate.json`**

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended", "helpers:pinGitHubActionDigests"],
  "minimumReleaseAge": "14 days"
}
```

- [ ] **Step 6: Update `README.md`**

Add a row to the "What you get" table after `navigable-codebases`:

```markdown
| **ci-pipelines** | Your agent builds CI as a thin wrapper around the repo's
own gate command, pins every action by SHA and keeps the pins current with
Renovate, grants workflow tokens only what each job needs, and makes sure
nightly jobs are smoke-run on every PR so they can't silently break. |
```

In the "Individual steps" sentence, add `lint-workflows` after `lint`, and add
`eval-behavior` after `eval-triggers`. Under "Check triggering", add one
sentence: `Behaviour cases (tag \`behavior\`) compare the agent with and without
devkit: \`mise run eval-behavior\`.`

- [ ] **Step 7: Verify and commit**

Run: `deno fmt && mise run release`. Expected: PASS, with
`Task lint-workflows actionlint` in the output and no actionlint findings.

```bash
git add .github/workflows renovate.json mise.toml deno.json README.md
git commit -m "ci: SHA-pin actions, least-privilege token, actionlint, Renovate"
```

---

### Task 5: Push and open the stacked PR

- [ ] **Step 1: Push**

Run: `git push -u origin feat/ci-pipelines-skill`

- [ ] **Step 2: Open the PR against PR #2's branch**

```bash
gh pr create --base chore/toolchain-and-skill-triggering --head feat/ci-pipelines-skill \
  --title "Add ci-pipelines skill; apply it to devkit's CI" \
  --body-file docs/superpowers/reviews/2026-10-10-ci-pipelines-evals.md
```

Then edit the PR body (`gh pr edit --body-file`) to prepend a summary: the
skill, the cuts and why, the trigger result, the CI changes, and the owner
action to **install the Renovate GitHub App**. Expected: a PR URL is printed.
