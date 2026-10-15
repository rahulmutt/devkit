---
max_turns: 8
runs: 3
tags: [behavior, commits-and-releases]
allowed_tools: [Skill]
---

This GitHub repo releases with release-please from Conventional Commits and
merges PRs with plain merge commits (no squash). Yesterday PR #48 was merged to
`main`. It contains a commit `update stuff` that added the `--json` output flag.
That commit should have been a `feat:`, and the flag is missing from the release
notes in the open release PR.

Fix it. Reply with exactly what you would do or run. Don't ask questions.
