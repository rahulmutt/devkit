---
max_turns: 8
runs: 3
tags: [behavior, commits-and-releases]
allowed_tools: [Skill]
---

You're working in a CLI tool's repo that releases with release-please from
Conventional Commits. Your working tree has two uncommitted changes:

1. `src/cli.ts`: the `--legacy` flag is removed. Users who pass it now get
   "unknown option". It was removed because the legacy output format was
   deprecated two releases ago and blocks the new renderer (issue #212).
2. `README.md`: fixes the typo "recieve" → "receive".

Commit this. Reply with the exact `git add` / `git commit` commands you would
run, including the full commit messages. Don't ask questions.
