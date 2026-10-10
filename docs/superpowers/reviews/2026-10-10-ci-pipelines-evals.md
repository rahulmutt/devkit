# ci-pipelines evals

## RED (no skill), 3 runs per case

| Case            | Grader         | Pass | Principle | Decision |
| --------------- | -------------- | ---- | --------- | -------- |
| ci-add-workflow | calls-gate     | 3/3  | 1         | cut      |
| ci-add-workflow | sha-pins       | 0/3  | 2         | keep     |
| ci-add-workflow | permissions    | 3/3  | 3         | cut      |
| ci-add-workflow | runner         | 1/3  | 2         | keep     |
| ci-add-workflow | updater        | 1/3  | 2         | keep     |
| ci-add-nightly  | smoke-on-pr    | 0/3  | 7         | keep     |
| ci-add-nightly  | failure-alert  | 0/3  | 7         | keep     |
| ci-add-nightly  | manual-trigger | 3/3  | 7         | cut      |
| ci-add-nightly  | entry-command  | 3/3  | 1         | cut      |
| ci-only-failure | env-first      | 3/3  | 6         | cut      |

Rule (from the spec): a grader the baseline passes 3/3 means that principle is
not taught by the skill. Mark it "cut" and drop it from SKILL.md in Task 2 (the
reference may keep its snippet).

Principles 4 and 5 have no grader; keep them (the spec has no measurement for
them). Principles 1 and 7 each have a mix of cut and keep graders: principle 1
is fully cut (both graders 3/3); principle 7 stays for smoke-on-pr and
failure-alert only (manual-trigger is cut).

Run cost: $1.03 (`evals/results/red.json`, gitignored).

## GREEN (with skill)

Full run (`evals/results/green.json`, $1.86), then one Step 6 iteration on
`ci-add-workflow` (`evals/results/green-iter1.json`, $0.55). The
`ci-add-workflow` rows below are from the iteration; the other cases are from
the full run.

| Case            | Grader         | With | Without |
| --------------- | -------------- | ---- | ------- |
| ci-add-workflow | calls-gate     | 3/3  | 3/3     |
| ci-add-workflow | sha-pins       | 3/3  | 0/3     |
| ci-add-workflow | permissions    | 3/3  | 3/3     |
| ci-add-workflow | runner         | 3/3  | 0/3     |
| ci-add-workflow | updater        | 3/3  | 0/3     |
| ci-add-nightly  | smoke-on-pr    | 3/3  | 0/3     |
| ci-add-nightly  | failure-alert  | 3/3  | 0/3     |
| ci-add-nightly  | manual-trigger | 3/3  | 3/3     |
| ci-add-nightly  | entry-command  | 3/3  | 3/3     |
| ci-only-failure | env-first      | 3/3  | 3/3     |

### Step 6 wording change (principle 2, one iteration)

The first full run had `ci-add-workflow` at sha-pins 0/3, runner 1/3, updater
2/3 (with arm). The case allows only the `Skill` tool, so the model loaded
SKILL.md but was denied reading `references/github-actions.md`. Without the
reference it had no SHAs, and it left `jdx/mise-action` (and sometimes
`actions/cache`) on tags "until Renovate pins them". That is a missing element,
so the fix makes it a required item in SKILL.md: every `uses:` is
`@<40-char SHA> # vX.Y.Z` with no tag pins, the current checkout and mise-action
pins are listed, and any other action is resolved with `git ls-remote` or left
out. The runner and updater misses in that run were judge verdicts on replies
that did use `ubuntu-24.04` and did add `renovate.json`; they passed 3/3 after
the change, which suggests judge noise rather than a wording problem.
