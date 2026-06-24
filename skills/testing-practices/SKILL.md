---
name: testing-practices
description: Use when deciding how to test or validate code — which form of validation (static checks, unit, integration, property/model/fuzz/mutation, UI, or formal methods), when to reach for each, and how to align it with the implementation. Delegates all tool installation to developer-environment.
---

# Testing Practices

Match the form of validation to the failure mode you are guarding against, and
default to the **cheapest layer that catches the bug class**. Climb the ladder
only when a cheaper layer cannot catch the failure:

`static checks → unit → integration → property / model / fuzz / mutation → UI → formal methods`

## Static validation — the base of the pyramid

Linters, formatters, and typecheckers are fast, total, always-on, and zero
runtime cost. They catch whole bug classes — type errors, undefined names,
unsafe patterns — before any test runs.

Lean on them **hardest in dynamic languages** — a strict typechecker
(`mypy`/`pyright`, `tsc --strict`) reclaims the safety a compiler gives
statically-typed languages for free.

Format-on-save + lint-in-CI are non-negotiable hygiene, not optional polish.

A strict typechecker config is itself a form of spec: keeping types precise and
`Any`/`any` out is "aligning validation with the implementation."

## Decision matrix

| Type                | Catches                                                 | Reach for it when                                                                        | Cost        |
| ------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------- |
| Unit                | Logic errors in a single unit                           | Pure logic, branches, edge cases                                                         | Low         |
| Integration         | Wiring/contract errors between components & real deps   | Behavior depends on collaborators, DB, services                                          | Medium      |
| Property-based      | Violated invariants across the input space              | A property holds for all inputs (round-trips, idempotence, ordering)                     | Medium      |
| Model-based         | Divergence from a reference model over action sequences | Stateful systems with a simpler model; the bridge to formal specs                        | Medium-High |
| Fuzz                | Crashes / panics / UB on malformed input                | Parsers, decoders, anything taking untrusted bytes                                       | Medium      |
| Mutation            | Weak or missing assertions (tests that don't test)      | Auditing an existing suite's real strength                                               | High (slow) |
| UI                  | Broken user-visible flows in a real browser             | Critical end-to-end paths through the UI                                                 | High        |
| Formal verification | Spec violations proven absent                           | Concurrency, protocols, critical invariants, security (see references/formal-methods.md) | Highest     |

## Aligning tests with the implementation

**Test behavior, not internals** — avoid brittle coupling to implementation
details; tests should survive refactors that preserve behavior.

**Right altitude** — pyramid/trophy: most weight on the cheap, fast layers; few
expensive end-to-end tests.

**Keep properties and specs in sync** as code evolves — a property or model that
no longer reflects the code is worse than none.

Test-first is **one valid workflow** — use it when it helps; this skill does not
mandate it.

## Integration tests: provision dependencies via devenv.nix

Integration tests needing real external services (Postgres, Redis, etc.) should
get them from **`devenv.nix`** (delegated to `developer-environment`), not
Docker / docker-compose / testcontainers.

**Why:** tests run in userspace with no daemon and no elevated privileges, and
work inside secure sandboxes; `devenv.nix` provisions the service for the
dev/test shell.

Docker is the **exception**, used only when something genuinely requires it —
e.g. validating a container image bound for Kubernetes.

This is the "system service" case `developer-environment`'s mise-first /
devenv.nix-fallback rule already covers.

## Installing tools

To install any runner, linter, typechecker, fuzzer, or service, use
**`developer-environment`** (mise-pinned, devenv.nix fallback). This skill names
the library and idiom and never gives install commands.

## References

- [`references/typescript.md`](references/typescript.md) — concrete library per
  role for TypeScript.
- [`references/python.md`](references/python.md) — concrete library per role for
  Python.
- [`references/rust.md`](references/rust.md) — concrete library per role for
  Rust.
- [`references/go.md`](references/go.md) — concrete library per role for Go.
- [`references/haskell.md`](references/haskell.md) — concrete library per role
  for Haskell.
- [`references/formal-methods.md`](references/formal-methods.md) — when formal
  methods earn their cost and which tool fits which problem.
