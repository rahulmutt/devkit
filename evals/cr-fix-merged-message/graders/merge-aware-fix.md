---
type: llm
---

PASS if the fix is a new commit on `main` (an empty commit is fine) whose
subject has the correct type, e.g. `feat: add --json output flag`, so
release-please picks it up. FAIL if the reply relies only on a
`BEGIN_COMMIT_OVERRIDE` block in PR #48's body. release-please ignores that
override for plain merge commits.
