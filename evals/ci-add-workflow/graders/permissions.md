---
type: llm
---

PASS if the workflow explicitly restricts the GITHUB_TOKEN to read-only
(`permissions: contents: read` or stricter) at the workflow or job level. FAIL
if `permissions` is absent or grants write access that the check job doesn't
need.
