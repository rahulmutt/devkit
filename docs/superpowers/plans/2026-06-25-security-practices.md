# security-practices Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a portable `security-practices` skill to the devkit marketplace —
a trust-boundary threat-aware design lens plus per-stack selection of free OSS
security scanners.

**Architecture:** A content skill matching the `testing-practices` shape:
`SKILL.md` holds the design lens + a tool decision matrix; `references/` holds
per-language SCA/SAST tables and one `distributed-systems.md` design-lens
deep-dive. It is wired into the marketplace by registering in `using-devkit`,
excluding its `references/` from `deno fmt`, adding a README row, and
regenerating all harness outputs. The repo's linter/generator gates are the test
harness — there is no runtime code.

**Tech Stack:** Markdown skill files; Deno tasks (`deno fmt`,
`deno task generate`, `deno task lint-skills`, `deno task ci`); the existing
skill-linter (`scripts/lib/lint/`).

## Global Constraints

- Skill files are **harness-agnostic**: describe actions ("run a shell
  command"), never harness-specific tool names — copied verbatim from the spec's
  Style note.
- `SKILL.md` frontmatter: `name` MUST equal the directory name
  `security-practices`; `description` MUST start with `Use when` and be ≤ 500
  chars (hard cap 1024) — enforced by `scripts/lib/lint/frontmatter.ts` and
  `budget.ts`.
- Every file under `references/` MUST be linked from `SKILL.md` body, and every
  link MUST resolve — enforced by `scripts/lib/lint/links.ts` (unlinked = warn,
  missing = error).
- The skill MUST be listed in `skills/using-devkit/SKILL.md` as the literal
  token `**security-practices**` — enforced by `scripts/lib/lint/registry.ts`.
- This skill **names tools and idioms only — never install commands**; all
  installation routes to `developer-environment`.
- `references/` are hand-authored and excluded from `deno fmt` (per the other
  skills and the user's standing rule: run `deno fmt` then regenerate; never
  hand-format generated outputs).
- The five reference languages are exactly: typescript, python, rust, go,
  haskell (the set the sibling skills use).

---

### Task 1: Author the skill content and wire it into the marketplace

**Files:**

- Create: `skills/security-practices/SKILL.md`
- Create: `skills/security-practices/references/distributed-systems.md`
- Create: `skills/security-practices/references/typescript.md`
- Create: `skills/security-practices/references/python.md`
- Create: `skills/security-practices/references/rust.md`
- Create: `skills/security-practices/references/go.md`
- Create: `skills/security-practices/references/haskell.md`
- Modify: `skills/using-devkit/SKILL.md` (add to "Available skills" list)
- Modify: `deno.json` (add `references` dir to `fmt.exclude`)
- Modify: `README.md` (add a row to the skills table, line ~13+)

**Interfaces:**

- Consumes: the `developer-environment` skill (referenced by name as the install
  delegate) and `testing-practices` (referenced for the "non-negotiable hygiene"
  stance). No code interfaces.
- Produces: a new skill directory discovered by `scripts/lib/lint/discover.ts`
  and by `deno task generate`. Later task consumes it via regeneration.

- [ ] **Step 1: Create `skills/security-practices/SKILL.md`**

```markdown
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
- Per-language SCA + SAST tools:
  [`references/typescript.md`](references/typescript.md),
  [`references/python.md`](references/python.md),
  [`references/rust.md`](references/rust.md),
  [`references/go.md`](references/go.md),
  [`references/haskell.md`](references/haskell.md).
```

- [ ] **Step 2: Create
      `skills/security-practices/references/distributed-systems.md`**

```markdown
# Security in distributed systems — the design lens

The portable mental model behind `security-practices`. Read it when designing or
changing anything that crosses a process or network boundary.

## Enumerate the trust boundaries

A distributed system is a graph of boundaries. Name each one — each is a place
to authenticate, authorize, and validate:

- client ↔ service
- service ↔ service
- service ↔ datastore
- service ↔ queue / event bus
- application ↔ dependency (the supply chain)

For every boundary ask: _what crosses it, who controls the other side, and what
happens if they are hostile?_

## Assume a hostile, partially-failed network

Every call can be intercepted, replayed, dropped, delayed, or reordered.

- Encrypt in transit (TLS; mTLS for service↔service).
- Make non-idempotent operations safe to retry with idempotency keys.
- Set timeouts and fail closed, not open.
- **Network location is not identity** — being "inside the perimeter" proves
  nothing. Authenticate the caller every time.

## Identity and least privilege

- Each service gets its own scoped identity and credentials — no shared
  god-tokens.
- Grant the narrowest permission that still works; widen only on demand.
- Prefer short-lived, rotatable credentials over long-lived static ones.

## Secrets

- Never in code, images, logs, or error messages.
- Injected at runtime (env / secret store), never committed.
- This is where the design rule and **secret scanning** meet: the scanner is the
  backstop for the rule.

## Supply chain

Dependencies are an untrusted boundary you cross on every build.

- **Pin** versions for reproducibility (delegated to `developer-environment`).
- **Scan** dependencies for known CVEs (SCA).
- Prefer fewer, well-maintained, audited dependencies; each one is attack
  surface.
- Keep SBOM awareness — know what you ship.

## Defense in depth

No single control is load-bearing. Validate at each layer, assume any one
control can fail, and make the next layer catch it. When in doubt, fail closed.

Tooling install for any of the above → use the **developer-environment** skill.
```

- [ ] **Step 3: Create `skills/security-practices/references/typescript.md`**

```markdown
# TypeScript / JavaScript security tooling

| Role              | Tool                         | Idiom                                                                      |
| ----------------- | ---------------------------- | -------------------------------------------------------------------------- |
| Dependency / SCA  | osv-scanner (or `npm audit`) | `osv-scanner --lockfile=package-lock.json`; fail CI on known CVEs          |
| SAST              | Semgrep                      | `semgrep --config p/javascript --config p/typescript`; fail on findings    |
| SAST (lint-level) | eslint security rules        | `eslint-plugin-security` / `eslint-plugin-no-unsanitized` in the lint pass |

**Emphasis:** most JS/TS vulns enter through dependencies and unsanitized sink
usage (DOM XSS, `eval`, `child_process`) — lean on SCA plus the no-unsanitized
eslint rules first.

To install any of these → use the **developer-environment** skill.
```

- [ ] **Step 4: Create `skills/security-practices/references/python.md`**

```markdown
# Python security tooling

| Role                  | Tool                       | Idiom                                                       |
| --------------------- | -------------------------- | ----------------------------------------------------------- |
| Dependency / SCA      | pip-audit (or osv-scanner) | `pip-audit` against the locked environment; fail CI on CVEs |
| SAST                  | Bandit                     | `bandit -r src/`; allow `# nosec` only with justification   |
| SAST (cross-language) | Semgrep                    | `semgrep --config p/python`                                 |

**Emphasis:** watch the dynamic-language sinks — `pickle` / `yaml.load`,
`subprocess` with `shell=True`, and string-built SQL. Bandit flags these; pair
with parameterized queries and `yaml.safe_load`.

To install any of these → use the **developer-environment** skill.
```

- [ ] **Step 5: Create `skills/security-practices/references/rust.md`**

```markdown
# Rust security tooling

| Role              | Tool             | Idiom                                                        |
| ----------------- | ---------------- | ------------------------------------------------------------ |
| Dependency / SCA  | cargo-audit      | `cargo audit` against `Cargo.lock` (RustSec advisory DB)     |
| Dependency policy | cargo-deny       | `cargo deny check advisories bans sources licenses`          |
| SAST              | Semgrep + clippy | `semgrep --config p/rust`; `cargo clippy` for security lints |

**Emphasis:** the type system and ownership model retire whole bug classes
(use-after-free, data races). The residual security surface is mostly `unsafe`
blocks, dependency CVEs, and logic errors — audit `unsafe` and lean on
cargo-audit / cargo-deny.

To install any of these → use the **developer-environment** skill.
```

- [ ] **Step 6: Create `skills/security-practices/references/go.md`**

```markdown
# Go security tooling

| Role                  | Tool        | Idiom                                                           |
| --------------------- | ----------- | --------------------------------------------------------------- |
| Dependency / SCA      | govulncheck | `govulncheck ./...` — reports only CVEs on reachable code paths |
| SAST                  | gosec       | `gosec ./...`; fail CI on findings                              |
| SAST (cross-language) | Semgrep     | `semgrep --config p/golang`                                     |

**Emphasis:** govulncheck's reachability analysis cuts false positives — prefer
it over a raw advisory match. Watch `os/exec`, `html/template` vs
`text/template` for injection, and unchecked error returns.

To install any of these → use the **developer-environment** skill.
```

- [ ] **Step 7: Create `skills/security-practices/references/haskell.md`**

```markdown
# Haskell security tooling

| Role             | Tool                                 | Idiom                                                    |
| ---------------- | ------------------------------------ | -------------------------------------------------------- |
| Dependency / SCA | cabal-audit (or OSV via osv-scanner) | audit `cabal.project.freeze` against advisory DBs        |
| SAST             | hlint + the type system              | `hlint` for hygiene; the type system carries most safety |

**Emphasis:** mature OSS SAST for Haskell is thin — be honest about that rather
than overstate coverage. Lean on the type system, parse-don't-validate at
boundaries, and `Safe` / `Trustworthy` Haskell where it applies. Dependency
scanning is still worth wiring in.

To install any of these → use the **developer-environment** skill.
```

- [ ] **Step 8: Register the skill in `skills/using-devkit/SKILL.md`**

In the "## Available skills" list, after the `writing-clean-code` bullet, add:

```markdown
- **security-practices** — how to think about security and which free OSS
  scanners to use. Use when designing, changing, or reviewing a distributed
  component, handling untrusted input or secrets, or choosing security tooling.
  Applies a trust-boundary threat lens and selects scanners (secret, dependency/
  SCA, SAST, container/IaC) for the repo's stack; tool installation delegates to
  developer-environment.
```

- [ ] **Step 9: Exclude the skill's `references/` from `deno fmt`**

In `deno.json`, add the new path to the `fmt.exclude` array (alongside the
existing three references dirs):

```json
"skills/security-practices/references"
```

- [ ] **Step 10: Add a README skills-table row**

In `README.md`, in the `| Skill | What it does for you |` table, add after the
`using-devkit` row:

```markdown
| **security-practices** | Before touching a distributed component or untrusted
input, the agent applies a trust-boundary threat lens — authn, authz, transport,
validation, secrets, supply chain — and wires in free OSS scanners (secret,
dependency/SCA, SAST, container/IaC) matched to the repo's stack. Tool
installation delegates to developer-environment. |
```

- [ ] **Step 11: Format the source files (references stay excluded)**

Run: `deno fmt` Expected: reformats `SKILL.md`, `using-devkit/SKILL.md`,
`README.md`, `deno.json` table/array alignment; leaves
`skills/security-practices/references/*` untouched (now excluded). Exit 0.

- [ ] **Step 12: Run the skill linter**

Run: `deno task lint-skills` Expected: PASS with no errors or warnings for
`security-practices` — confirms frontmatter (`name` matches dir, `description`
starts with "Use when", within budget), all six references are linked and
present, and the skill is registered in `using-devkit`.

- [ ] **Step 13: Run lint, typecheck, and fmt-check**

Run: `deno task fmt-check && deno task lint && deno task typecheck` Expected:
all PASS (no formatting drift, no lint errors, types check).
`deno task check`/`validate-manifests` are intentionally deferred to Task 2 —
generated outputs are still stale at this point.

- [ ] **Step 14: Commit the source changes**

```bash
git add skills/security-practices skills/using-devkit/SKILL.md deno.json README.md
git commit -m "feat: security-practices skill — threat-aware design lens + OSS scanner selection"
```

---

### Task 2: Regenerate harness outputs and verify the full gate

**Files:**

- Modify (generated, do not hand-edit): harness outputs under `.opencode/`,
  `.pi/`, `hooks/`, and any per-harness plugin manifests touched by
  `deno task generate`.

**Interfaces:**

- Consumes: the `security-practices` skill directory created in Task 1.
- Produces: regenerated, schema-valid manifests and harness copies so
  `deno task check` (generate --check) and `deno task validate-manifests` pass.

- [ ] **Step 1: Regenerate all harness outputs**

Run: `deno task generate` Expected: writes updated generated files so the new
skill is propagated to every harness. Exit 0.

- [ ] **Step 2: Confirm the generated tree is no longer stale**

Run: `deno task check` Expected: PASS — `generate --check` reports no drift
(everything regenerated in Step 1).

- [ ] **Step 3: Validate emitted manifests**

Run: `deno task validate-manifests` Expected: PASS — all per-harness manifests
remain schema-valid after the skill addition.

- [ ] **Step 4: Run the full CI gate**

Run: `deno task ci` Expected: PASS end-to-end (fmt-check, lint, typecheck,
check, validate-manifests, lint-skills, test).

- [ ] **Step 5: Manual discovery smoke check**

Run:
`grep -rl "security-practices" .opencode .pi hooks 2>/dev/null; grep -c "security-practices" skills/using-devkit/SKILL.md`
Expected: at least one generated harness path lists the skill, and the
`using-devkit` registry mentions it — confirming an agent will actually discover
it.

- [ ] **Step 6: Commit the regenerated outputs**

```bash
git add -A
git commit -m "chore: regenerate harness outputs for security-practices skill"
```

---

## Self-Review

**Spec coverage** (against
`docs/superpowers/specs/2026-06-25-security-practices-design.md`):

- Purpose — both jobs (threat-aware design lens + per-stack scanner selection) →
  Task 1 Steps 1–7. ✅
- File layout (SKILL.md + 6 references) → Task 1 Steps 1–7. ✅
- SKILL.md sections 1–6 (lens, controls table, tooling matrix, universal tools,
  install delegation, references pointer) → Step 1 content. ✅
- Per-language references (ts/py/rust/go/haskell, SCA+SAST, closing install
  line) → Steps 3–7. ✅
- distributed-systems.md (boundaries, hostile network, identity, secrets, supply
  chain, defense in depth) → Step 2. ✅
- Marketplace integration (registry, fmt.exclude, regenerate, README) → Steps
  8–10 + Task 2. ✅
- Verification (lint-skills, validate-manifests, full ci, smoke check) → Task 1
  Steps 12–13, Task 2 Steps 2–5. ✅
- Non-goals respected: no DAST/security-fuzzing category, no install commands,
  no devkit-repo CI wiring, five languages only. ✅

**Placeholder scan:** No TBD/TODO; every file's full content is inline; every
command has an expected result. ✅

**Type/name consistency:** Skill name `security-practices` is identical across
frontmatter, directory paths, `using-devkit` token (`**security-practices**`),
README, and commit messages. All six reference filenames match between SKILL.md
links and the create steps (`distributed-systems`, `typescript`, `python`,
`rust`, `go`, `haskell`). ✅
