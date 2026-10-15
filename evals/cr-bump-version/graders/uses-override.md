---
type: llm
---

PASS if the reply changes what release-please reads. Two ways count: editing
merged PR #41's body to add a `BEGIN_COMMIT_OVERRIDE` / `END_COMMIT_OVERRIDE`
block with a `feat:` message, or adding a commit with a `Release-As: 1.3.0`
footer (ideally both). FAIL if it does neither.
