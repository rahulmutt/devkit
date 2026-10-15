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
