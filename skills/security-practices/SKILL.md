---
name: security-practices
description: Use when designing, changing, or reviewing a distributed component, handling untrusted input or secrets, or choosing security tooling — apply a trust-boundary threat lens (authn, authz, transport, validation, secrets, supply chain) and select free OSS scanners (secret, dependency/SCA, SAST, container/IaC) for the repo's stack. Delegates all tool installation to developer-environment.
---

# Security Practices

Treat every boundary as a trust decision. In a distributed system, every place
data crosses a boundary — a network call, a queue, user input, another service,
a dependency — is untrusted until proven otherwise. When you design or change a
component, name the boundary, ask _what crosses it and who controls that_, and
apply the control it demands. **Defense in depth** and **least privilege** are
the two governing defaults: no single control is load-bearing, and every
identity gets the narrowest access that still works.

## Commit a threat model

The boundary lens above is reasoning you do in the moment; a **threat model** is
that reasoning written down and committed to the repo. Without it, every agent
and contributor re-derives what you are defending and against whom — usually
incompletely. Commit the artifact so the assumptions are durable and
discoverable: the assets you protect, the adversaries you assume, the boundaries
that matter, and what is explicitly out of scope.

Write one when a component handles untrusted input, secrets, or
cross-trust-boundary traffic, and revisit it when those boundaries change. Keep
it in the repo (location is yours) and point to it from `CLAUDE.md` /
`AGENTS.md` so agents load it before touching security-sensitive code. Full
method and template → [`references/threat-model.md`](references/threat-model.md).

## Controls — match the boundary to its control

| Boundary / risk           | Control                                   | Reach for it when                                        |
| ------------------------- | ----------------------------------------- | -------------------------------------------------------- |
| Caller identity unknown   | Authentication (service identity, tokens) | Any request crossing a service or trust boundary         |
| Caller may exceed rights  | Authorization, least privilege            | The caller could reach data/actions beyond its scope     |
| Untrusted network in path | Transport encryption (TLS / mTLS)         | Anything leaving the process, especially service↔service |
| Input from outside        | Validate & canonicalize at the edge       | Parsing, deserializing, or trusting any external bytes   |
| Credentials in the system | Secrets handling (inject at runtime)      | Any key, token, or password the code needs               |
| Endpoint abuse / replay   | Rate limits, idempotency keys, timeouts   | Public or expensive endpoints; non-idempotent writes     |
| Code you did not write    | Supply-chain trust (pin + scan deps)      | Every third-party dependency                             |

For the reasoning behind these — boundary enumeration, hostile-network
assumptions, identity, and supply chain — read
[`references/distributed-systems.md`](references/distributed-systems.md).

## Security tooling — match the scanner to the stack

Pick the categories that fit the repo and wire each where it catches problems
earliest:

| Category         | Catches                                                            | Integration point                               |
| ---------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| Secret scanning  | Committed credentials / keys                                       | pre-commit (block) + CI                         |
| Dependency / SCA | Known CVEs in dependencies                                         | CI gate + scheduled (new CVEs land on old code) |
| SAST             | Vulnerable code patterns (injection, SSRF, unsafe deserialization) | CI                                              |
| Container / IaC  | Misconfig in Dockerfile / Terraform / k8s                          | CI — only when those artifacts exist            |

Secret-scan-in-pre-commit and SCA-in-CI are non-negotiable hygiene, not optional
polish — the stance `testing-practices` takes on lint-in-CI. Container/IaC
scanning is conditional: run it only when the repo actually has those artifacts.

### Universal tools (not language-specific)

- **Secret scanning:** gitleaks (default), trufflehog, or detect-secrets —
  language-agnostic; scan history and every commit.
- **Container / IaC:** Trivy (images, IaC, dependencies, and secrets in one),
  Checkov (IaC policy), hadolint (Dockerfile), kube-linter (Kubernetes).

Multi-purpose scanners (Trivy, osv-scanner) span several categories — prefer one
that covers the need over stacking redundant tools.

## Installing tools

This skill names the tool and the idiom; it never gives install commands. To
install any scanner, use **`developer-environment`** (mise-pinned, devenv.nix
fallback).

## References

- [`references/distributed-systems.md`](references/distributed-systems.md) — the
  full trust-boundary design lens.
- [`references/threat-model.md`](references/threat-model.md) — how to write and
  commit a threat model (lightweight method + STRIDE deepening).
- Per-language SCA + SAST tools:
  [`references/typescript.md`](references/typescript.md),
  [`references/python.md`](references/python.md),
  [`references/rust.md`](references/rust.md),
  [`references/go.md`](references/go.md),
  [`references/haskell.md`](references/haskell.md).
