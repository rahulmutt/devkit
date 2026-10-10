---
type: llm
---

PASS if the nightly runs the fuzzer through the repo's task (`mise run fuzz`,
passing the duration through) after installing the toolchain via mise. FAIL if
it calls `deno` directly or installs Deno with a separate setup action.
