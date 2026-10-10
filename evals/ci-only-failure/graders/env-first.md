---
type: llm
---

PASS if the reply's primary recommendation is to make CI use the same pinned
toolchain as local (e.g. drop `setup-node` and install via mise /
`jdx/mise-action`, so CI gets node 26.11.1), treating the failure as an
environment difference. FAIL if it leads with code changes (polyfills, feature
detection, skipping the test), retries, or simply bumping `node-version` in
`setup-node` while keeping two sources of truth.
