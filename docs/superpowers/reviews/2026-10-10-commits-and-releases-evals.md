# commits-and-releases evals

## RED (no skill), 3 runs per case

The RED arm is the with-plugin arm under `--ablation none`, run before the skill
existed. 3 runs per case is coarse.

| Case                  | Grader            | Pass | Principle | Decision |
| --------------------- | ----------------- | ---- | --------- | -------- |
| cr-commit-message     | two-commits       | 3/3  | 3         | cut      |
| cr-commit-message     | conventional-type | 3/3  | 1         | cut      |
| cr-commit-message     | breaking-marked   | 3/3  | 2         | cut      |
| cr-commit-message     | body-why          | 3/3  | 4         | cut      |
| cr-bump-version       | no-hand-edit      | 2/3  | 5         | keep     |
| cr-bump-version       | uses-override     | 3/3  | 5         | keep     |
| cr-bump-version       | no-ship           | 3/3  | 6         | cut      |
| cr-fix-merged-message | no-force-push     | 3/3  | 7         | cut      |
| cr-fix-merged-message | merge-aware-fix   | 0/3  | 5         | keep     |

Rule (from the spec): a principle is cut from SKILL.md only if the baseline
passes every one of its graders 3/3. It is kept if any of its graders fails at
least once. The reference may keep the syntax for cut principles.

Kept: 5. Cut: 1, 2, 3, 4, 6, 7.

## GREEN (with skill)

Both arms, 3 runs per case (`--case 'cr-*'`, `evals/results/cr-green.json`,
$1.46). The skill fired in every `with` run and in no `without` run.

| Case                  | Grader            | With | Without |
| --------------------- | ----------------- | ---- | ------- |
| cr-commit-message     | two-commits       | 3/3  | 3/3     |
| cr-commit-message     | conventional-type | 3/3  | 3/3     |
| cr-commit-message     | breaking-marked   | 3/3  | 3/3     |
| cr-commit-message     | body-why          | 3/3  | 3/3     |
| cr-bump-version       | no-hand-edit      | 3/3  | 3/3     |
| cr-bump-version       | uses-override     | 3/3  | 3/3     |
| cr-bump-version       | no-ship           | 3/3  | 3/3     |
| cr-fix-merged-message | no-force-push     | 3/3  | 3/3     |
| cr-fix-merged-message | merge-aware-fix   | 3/3  | 1/3     |

Kept graders: `merge-aware-fix` goes from 0/3 (RED) and 1/3 (without) to 3/3.
`no-hand-edit` goes from 2/3 (RED) to 3/3, but the `without` arm also scored 3/3
this time, so that gain is within 3-run noise. `uses-override` holds at 3/3.

No Step 6 wording changes were needed.
