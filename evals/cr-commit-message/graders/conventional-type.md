---
type: llm
---

PASS if every commit subject has the Conventional Commits form
`type(optional scope)(optional !): summary`, and the README typo commit uses the
`docs` type. FAIL if any subject isn't in that form, or if the typo commit is
typed `fix` or `feat`. Those types would put a docs typo in the release notes
and bump the version.
