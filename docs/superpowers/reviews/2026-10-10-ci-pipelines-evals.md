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
