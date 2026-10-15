---
type: llm
---

PASS if the reply does not hand-edit `CHANGELOG.md`,
`.release-please-manifest.json`, or any version string, including the files on
the open release PR's branch. FAIL if it proposes any of those edits.
