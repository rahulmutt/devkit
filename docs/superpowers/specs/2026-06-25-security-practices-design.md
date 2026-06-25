# security-practices skill — design

**Date:** 2026-06-25 **Status:** Approved (brainstorming) **Marketplace:**
devkit

## Purpose

Add a `security-practices` skill to the devkit marketplace — the security
counterpart to `testing-practices`. It is a **portable** skill: guidance the
agent applies to whatever repo it is working in, not a one-off hardening of the
devkit repo itself.

It does two jobs:

1. **Trigger threat-aware design.** A compact lens the agent applies when
   designing or changing distributed components: identify the trust boundary,
   ask _what crosses it and who controls that_, and apply the matching control.
   Principle-first, like `writing-clean-code`. Points to tools when a control is
   missing.
2. **Match free OSS security tooling to the repo's stack.** A decision matrix
   over four categories (secret scanning, dependency/SCA, SAST, container/IaC),
   with concrete per-language tool names in `references/`. All installation is
   delegated to the existing `developer-environment` skill.

## Non-goals (YAGNI)

- A comprehensive security manual (crypto internals, zero-trust architecture,
  IAM, compliance) — the design lens stays actionable, not encyclopedic.
- Installation commands — always delegate to `developer-environment`.
- Exhaustive tool catalogs — one or two recommended OSS options per role.
- DAST / runtime fuzzing-for-security as first-class categories — out of scope
  for this iteration (SAST + SCA + secrets + container/IaC cover the high-value,
  always-applicable ground).
- Languages beyond the five the sibling skills already use.
- Wiring security tools into the devkit repo's own CI (that was the rejected
  "this repo" interpretation).

## File layout

```
skills/security-practices/
├── SKILL.md                       # design lens + tool decision matrix (core)
└── references/
    ├── typescript.md              # SCA + SAST tools per role, per language
    ├── python.md
    ├── rust.md
    ├── go.md
    ├── haskell.md
    └── distributed-systems.md     # the deeper threat-aware design lens
```

Style: harness-agnostic throughout — actions ("run a shell command", "read a
file"), never harness-specific tool names — matching the existing skills.
Secret-scanning and container/IaC tools are **universal / artifact-driven**, so
they live in SKILL.md and are not repeated per language; per-language references
cover only the two language-specific categories (SCA + SAST).

## SKILL.md content (~70–85 lines)

### 1. The design lens — every boundary is a trust decision

In a distributed system, every place data crosses a boundary (network call,
queue, user input, another service, a dependency) is untrusted until proven
otherwise. When designing or changing a component: identify the boundary, ask
_what crosses it and who controls that_, and apply the matching control.
**Defense in depth** and **least privilege** are the two governing defaults.

### 2. Controls checklist

A compact table: boundary type → the control it demands → reach for it when.
Rows cover authn/identity, authz/least-privilege, transport (TLS/mTLS), input
validation at the boundary, secrets handling, rate-limit/replay protection, and
supply-chain trust.

### 3. Tooling decision matrix (the four categories)

| Category         | Catches                                                            | Integration point                               |
| ---------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| Secret scanning  | Committed credentials / keys                                       | **pre-commit** (block) + CI                     |
| Dependency / SCA | Known CVEs in dependencies                                         | **CI gate** + scheduled (new CVEs hit old code) |
| SAST             | Vulnerable code patterns (injection, SSRF, unsafe deserialization) | CI                                              |
| Container / IaC  | Misconfig in Dockerfile / Terraform / k8s                          | CI — **only when those artifacts exist**        |

Posture rule (echoing `testing-practices`' "lint-in-CI is non-negotiable"):
secret-scan-in-pre-commit and SCA-in-CI are non-negotiable hygiene, not optional
polish. Container/IaC scanning applies conditionally, gated on the presence of
those artifacts.

### 4. Universal tools, named inline

- **Secret scanning:** gitleaks (default), trufflehog, detect-secrets.
- **Container / IaC:** Trivy (images + IaC + SCA + secrets — multi-purpose),
  Checkov (IaC), hadolint (Dockerfile), kube-linter (k8s).

Note multi-purpose scanners (Trivy, osv-scanner) span categories so the agent
doesn't stack redundant tools.

### 5. Install delegation

Names tools and idioms only — never install commands. All installation routes
through `developer-environment` (mise-pinned, devenv.nix fallback).

### 6. References pointer

For the concrete SCA/SAST tools of a language, read `references/<language>.md`.
For the full distributed-systems design lens, read
`references/distributed-systems.md`.

## Per-language reference docs

Each of `typescript.md`, `python.md`, `rust.md`, `go.md`, `haskell.md` is a
compact `Role | Tool | Idiom` table covering the two language-specific
categories (SCA + SAST), closing with the `testing-practices` convention line:
_"To install any of these → use the **developer-environment** skill."_

| Lang          | SCA                       | SAST                                                                                                |
| ------------- | ------------------------- | --------------------------------------------------------------------------------------------------- |
| TypeScript/JS | osv-scanner / `npm audit` | Semgrep (`p/typescript`, `p/javascript`), eslint security rules                                     |
| Python        | pip-audit / osv-scanner   | Bandit, Semgrep (`p/python`)                                                                        |
| Rust          | cargo-audit / cargo-deny  | clippy security lints + Semgrep; note the type system retires whole bug classes                     |
| Go            | govulncheck               | gosec, Semgrep (`p/golang`)                                                                         |
| Haskell       | `cabal audit` / OSV       | hlint + type system; honest note that mature OSS SAST is thin — lean on types & boundary discipline |

## distributed-systems.md

The "general guidelines for security in distributed systems" in full (~40–60
lines, principle-first, the analog of `formal-methods.md`):

- **Trust boundaries** — enumerate them (client↔service, service↔service,
  service↔datastore, service↔queue, app↔dependency). Each is a place to
  authenticate, authorize, and validate.
- **Assume a hostile, partially-failed network** — every call can be
  intercepted, replayed, dropped, or delayed → TLS/mTLS, idempotency keys,
  timeouts; network location is not identity ("the perimeter is not identity").
- **Identity & least privilege** — services get their own scoped, short-lived
  credentials; no shared god-tokens; rotate.
- **Secrets** — never in code, images, logs, or error messages; injected at
  runtime. This is where secret-scanning and the design rule meet.
- **Supply chain** — dependencies are an untrusted boundary too: pin (ties to
  `developer-environment`), scan (SCA), prefer fewer/audited deps; SBOM
  awareness.
- **Defense in depth** — no single control is load-bearing; validate at each
  layer and fail closed.
- Closing: tooling install → `developer-environment`.

## Integration with the marketplace

- **Register** in `skills/using-devkit/SKILL.md` "Available skills" with a
  one-line description (the `registry` linter greps for `**security-practices**`
  and fails the build otherwise).
- **`fmt` exclude:** add `skills/security-practices/references` to `deno.json`'s
  `fmt.exclude`, matching the other skills' hand-authored reference tables.
- **Regenerate:** `deno task fmt` (fmt → generate) propagates the skill into all
  seven harness outputs (`.opencode`, `.pi`, hooks, plugin manifests).
- **README:** add a row to the skills table.

## Verification

- **Skill linter** (`deno task lint-skills`): frontmatter valid; SKILL.md
  `description` ≤ 500 chars (hard cap 1024); all `references/*.md` links
  resolve; `security-practices` listed in `using-devkit`.
- **Manifest validation** (`deno task validate-manifests`): regenerated
  manifests across all seven harnesses stay schema-valid.
- **Full gate:** `deno task ci` green (fmt-check, lint, typecheck, check,
  validate-manifests, lint-skills, test).
- **Manual smoke check:** after `deno task fmt`, the skill appears in a
  generated harness output and `using-devkit` lists it, so the agent discovers
  it.

No new unit tests — the skill is content; the repo's existing linter/generator
tests cover the machinery that consumes it.

## Success criteria

- An agent invoking `security-practices` can, for a change to a distributed
  component, name the trust boundary and the control it needs without leaving
  SKILL.md.
- For any of the five languages, the agent finds the concrete SCA + SAST tool in
  one reference doc.
- The agent picks the right tool category for the repo's actual stack and the
  right integration point (pre-commit vs. CI), and never emits install commands
  (routes to `developer-environment`).
- Container/IaC scanning is recommended only when those artifacts exist.
- The new skill passes `deno task ci` end-to-end.
