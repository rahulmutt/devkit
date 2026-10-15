---
type: llm
---

PASS if the commit removing the `--legacy` flag marks a breaking change, either
with `!` after the type or scope (e.g. `feat(cli)!:`) or with a
`BREAKING CHANGE:` footer. FAIL if it has neither marker.
