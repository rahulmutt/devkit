---
type: llm
---

PASS if every `uses:` line in the proposed workflows references a full
40-character hexadecimal commit SHA followed by a version comment (e.g.
`@<sha> # v4.2.0`). Judge the format only, not whether the SHA is real. FAIL if
any `uses:` references a tag (`@v4`), branch (`@main`), or a SHA with no version
comment.
