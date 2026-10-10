---
type: llm
---

PASS if the CI workflow's check step invokes the repo's gate task
(`mise run release`, or `deno task ci` after installing the toolchain via mise)
as a single command. FAIL if it re-implements the checks as separate inline
steps (e.g. its own `deno fmt --check`, `deno lint`, `deno test` steps) instead
of calling the task.
