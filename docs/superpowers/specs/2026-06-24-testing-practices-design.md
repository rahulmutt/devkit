# testing-practices skill — design

**Date:** 2026-06-24
**Status:** Approved (brainstorming)
**Marketplace:** devkit

## Purpose

Add a `testing-practices` skill to the devkit marketplace. Its primary job is to
be a **decision framework**: given what the agent is building and the failure
mode it needs to guard against, decide *which* form of validation to reach for,
*when*, and *how to align it with the implementation*. Concrete per-language
library/framework choices live in `references/` as supporting depth. All
installation/tooling concerns are delegated to the existing
`developer-environment` skill.

The skill spans the full validation ladder, cheapest-and-broadest first:

```
static checks → unit → integration → property / model / fuzz / mutation → UI → formal methods
```

## Non-goals (YAGNI)

- Tutorials for formal-methods tools (Lean, Quint, TLA+, …) — pointers only.
- Exhaustive library catalogs per language — one recommended option per role.
- Installation commands — always delegate to `developer-environment`.
- CI pipeline configuration depth.
- Languages beyond the five below (Java, C#, etc. can follow the same template later).
- Mandating test-first/TDD — the skill is TDD-neutral and has no hard dependency
  on the superpowers TDD skill.

## File layout

```
skills/testing-practices/
├── SKILL.md                    # the decision framework (core deliverable)
└── references/
    ├── typescript.md           # test-type/role → library + idiom, per language
    ├── python.md
    ├── rust.md
    ├── go.md
    ├── haskell.md
    └── formal-methods.md       # when-to-reach-for-it + tool→problem map
```

Style: harness-agnostic throughout — actions ("run a shell command", "read a
file"), never harness-specific tool names — matching `developer-environment` and
`using-devkit`.

## SKILL.md content

### 1. The rule (stance)

Match the form of validation to the failure mode you're guarding against, and
default to the cheapest layer that catches the bug class. Climb the ladder only
when a cheaper layer cannot catch the failure.

### 2. Static validation layer

Linters, formatters, and typecheckers are the base of the pyramid: fast, total,
always-on, zero runtime cost. They catch whole bug classes (type errors,
undefined names, unsafe patterns) before any test runs.

- Lean on them **hardest in dynamic languages**, where a strict typechecker
  (mypy/pyright, `tsc --strict`) reclaims the safety a compiler gives statically
  typed languages for free.
- Format-on-save + lint-in-CI are non-negotiable hygiene, not optional polish.
- A strict typechecker config is itself a form of spec: keeping types precise and
  `Any`/`any` out is "aligning validation with implementation."

### 3. Decision matrix (the 8 test types)

A compact table. One to two lines per row covering: **what it catches · when to
reach for it · what it costs · how it aligns with the code.** Rows:

| Type | Catches | Reach for it when | Cost |
|------|---------|-------------------|------|
| Unit | Logic errors in a single unit | Pure logic, branches, edge cases | Low |
| Integration | Wiring/contract errors between components & real deps | Behavior depends on collaborators, DB, services | Medium |
| Property-based | Violated invariants across input space | A property holds for all inputs (round-trips, idempotence, ordering) | Medium |
| Model-based | Divergence from a reference model over sequences | Stateful systems with a simpler model; also the bridge to formal specs | Medium-High |
| Fuzz | Crashes/panics/UB on malformed input | Parsers, decoders, anything taking untrusted bytes | Medium |
| Mutation | Weak/missing assertions (tests that don't test) | Auditing an existing suite's real strength | High (slow) |
| UI | Broken user-visible flows in a real browser | Critical end-to-end paths through the UI | High |
| Formal verification | Spec violations proven absent | Concurrency, protocols, critical invariants, security (see `formal-methods.md`) | Highest |

### 4. Aligning tests with implementation (TDD-neutral)

- **Test behavior, not internals** — avoid brittle coupling to implementation
  details; tests should survive refactors that preserve behavior.
- **Right altitude** — pyramid/trophy: most weight on the cheap, fast layers; few
  expensive end-to-end tests.
- **Keep specs/properties in sync** as code evolves; a property or model that no
  longer reflects the code is worse than none.
- Test-first is **one valid workflow**, mentioned but not mandated.

### 5. Integration testing — provision deps via devenv.nix, not Docker

Integration tests that need real external services (Postgres, Redis, etc.) should
get them from **`devenv.nix`** (delegated to `developer-environment`), not from
Docker / docker-compose / testcontainers.

- **Why:** tests run in userspace without a daemon or elevated privileges, and
  work inside secure sandboxes. devenv.nix provisions the service in-process for
  the dev/test shell.
- Docker is the exception, used only when something genuinely requires it — e.g.
  validating a container image bound for Kubernetes.
- This is the exact "system service" case the mise-first / devenv.nix-fallback
  rule in `developer-environment` already covers, so the cross-skill story is
  consistent.

### 6. Tooling delegation

To install any runner, linter, typechecker, fuzzer, or service: use
`developer-environment` (mise-pinned, devenv.nix fallback). This skill names the
library and the idiom; it never gives install commands.

### 7. References pointer

When the concrete library for a language is needed, read the matching
`references/<language>.md`. For formal methods, read `references/formal-methods.md`.

## Per-language reference docs

Each of `typescript.md`, `python.md`, `rust.md`, `go.md`, `haskell.md` contains:

- A table mapping each applicable role → recommended library/framework + a
  one-line idiom. Roles: static (lint/format/typecheck), unit, integration,
  property-based, fuzz, mutation, UI (where relevant), model-based (where a
  library exists).
- Language-specific gotchas and the dynamic-vs-static emphasis.
- Where the language's integration story usually reaches for Docker (TS
  `testcontainers`, Python `pytest-docker`, Go `dockertest`), an explicit
  redirect to a `devenv.nix`-provisioned service + the language's plain
  client/driver instead.
- A closing "to install → `developer-environment`" line.

Indicative (not exhaustive) recommendations:

- **TypeScript/JS:** eslint + formatter + `tsc --strict` (static); vitest/built-in
  runner (unit/integration); fast-check (property); built-in/jsfuzz (fuzz);
  Stryker (mutation); Playwright (UI).
- **Python:** ruff (lint+format) + mypy/pyright strict (static); pytest
  (unit/integration); hypothesis (property + stateful/model-based); atheris
  (fuzz); mutmut/cosmic-ray (mutation); Playwright (UI).
- **Rust:** clippy + rustfmt + the compiler (static); built-in `#[test]`
  (unit/integration); proptest/quickcheck (property); cargo-fuzz (fuzz);
  cargo-mutants (mutation); kani noted under formal methods.
- **Go:** vet + gofmt + staticcheck (static); built-in `testing`
  (unit/integration); gopter (property); built-in fuzzing (fuzz); go-mutesting
  (mutation).
- **Haskell:** compiler + hlint + ormolu/fourmolu (static); hspec/tasty
  (unit/integration); QuickCheck/hedgehog (property + state machine/model-based).

## formal-methods.md

- **When formal methods earn their cost:** concurrency, distributed protocols,
  critical invariants, security properties — cases where the state space is too
  large to test exhaustively and a counterexample is expensive in production.
- **Tool → problem map:**
  - TLA+ / Quint — protocols & concurrency (model checking temporal properties).
  - Lean / Coq / Isabelle — theorem proving for mathematical/logical correctness.
  - Alloy — structural/relational modeling, bounded checking.
  - Dafny / Kani — code-level verification.
  - Property-based testing as the gateway: the cheapest way to start thinking in
    invariants before committing to a heavyweight spec.
- **Aligning a spec with implementation:** model-based testing as the bridge —
  derive tests from the model and check the implementation conforms; refinement
  as the formal version of the same idea.
- Pointers to learn more; **tooling install → `developer-environment`.**

## Integration with the marketplace

- Update `skills/using-devkit/SKILL.md` "Available skills" to list
  `testing-practices` with a one-line description.
- Verify the marketplace drift/consistency guards (pre-commit tests from commit
  `3378d9a`) pick up the new skill cleanly; regenerate any per-harness artifacts
  if generation requires it.
- Skills appear to be discovered from `skills/`; confirm no explicit registration
  is needed in `marketplace.config.ts` beyond the `using-devkit` listing.

## Success criteria

- An agent invoking `testing-practices` can decide, for a given task, which
  validation layer(s) to use and at what altitude — without leaving SKILL.md.
- For any of the five languages, the agent can find the concrete recommended
  library per role in one reference doc.
- The agent never emits install commands from this skill — it routes to
  `developer-environment`.
- Integration-test guidance steers to devenv.nix-provisioned services over Docker
  by default.
- The new skill passes the marketplace's existing drift/consistency checks.
