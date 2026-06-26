---
name: testing-practices
description: Use when deciding how to test or validate code — which form of validation (static checks, unit, integration, property/model/fuzz/mutation, UI, or formal methods), when to reach for each, and how to align it with the implementation. Delegates all tool installation to developer-environment.
---

# Testing Practices

Match the form of validation to the failure mode you are guarding against, and
default to the **cheapest layer that catches the bug class**. Climb the ladder
only when a cheaper layer cannot catch the failure:

`static checks → unit → integration → property / model / fuzz / mutation → simulation (DST) → UI → formal methods`

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

| Type                | Catches                                                 | Reach for it when                                                                                             | Cost        |
| ------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------- |
| Unit                | Logic errors in a single unit                           | Pure logic, branches, edge cases                                                                              | Low         |
| Golden / snapshot   | Unintended changes to large structured output           | Stable, reviewable serialized output (codegen, CLI, AST/IR, API JSON, render trees)                           | Low         |
| Integration         | Wiring/contract errors between components & real deps   | Behavior depends on collaborators, DB, services                                                               | Medium      |
| Property-based      | Violated invariants across the input space              | A property holds for all inputs (round-trips, idempotence, ordering)                                          | Medium      |
| Model-based         | Divergence from a reference model over action sequences | Stateful systems with a simpler model; the bridge to formal specs                                             | Medium-High |
| Fuzz                | Crashes / panics / UB on malformed input                | Parsers, decoders, anything taking untrusted bytes                                                            | Medium      |
| Mutation            | Weak or missing assertions (tests that don't test)      | Auditing an existing suite's real strength                                                                    | High (slow) |
| UI                  | Broken user-visible flows in a real browser             | Critical end-to-end paths through the UI                                                                      | High        |
| Simulation / DST    | Heisenbugs from timing, faults, interleavings           | Distributed/concurrent systems where reproducibility is the core problem (see `references/formal-methods.md`) | High        |
| Chaos / resilience  | Availability/resilience failures under real faults      | Validating a live distributed system stays up and degrades gracefully                                         | High        |
| Formal verification | Spec violations proven absent                           | Concurrency, protocols, critical invariants, security (see references/formal-methods.md)                      | Highest     |

## Choosing a test oracle

The **oracle** is how a test decides pass/fail. Pick it by what you can know
about the correct answer:

- **Specified** — assert the exact expected value. Use when you know the answer.
- **Recorded** — golden / snapshot: capture a known-good output and diff future
  runs against it. Use when the answer is stable but tedious to hand-write.
- **Derived** — compare against another oracle you trust: **differential**
  testing (run a reference or previous implementation on the same input and
  compare outputs) or **metamorphic** testing (assert relations between
  outputs). Use when you cannot state the answer but can compare.
- **Invariant** — property-based: assert a rule that must hold for all inputs.
  Use when you know a rule, not a value.

Golden, differential, and property tests are points on this spectrum, not
separate disciplines — choose the oracle that matches what you can actually
assert.

## Golden / snapshot tests

A golden (snapshot) test records a known-good output as a committed reference
and fails when future output diverges. It is a **recorded oracle**, not a rung
on the cheapest-layer ladder — apply it at unit, integration, or UI altitude.

**Reach for it** when the output is large, structured, and serialization-stable
enough for a human to review: CLI/terminal output, rendered DOM or component
trees, compiler/AST/IR, API JSON, generated code, formatter output. **Skip it**
for small scalars (assert them explicitly) or blobs no reviewer can judge.

Keep them honest:

- Keep snapshots **narrow** — a focused value, not a whole page; over-broad
  snapshots are brittle and unreviewable.
- **Review** every snapshot change in code review; never blind-accept with an
  `--update` / `-u` flag.
- Make output **deterministic** — redact timestamps, UUIDs, ANSI codes, and
  unstable ordering.

Golden/snapshot is the more-automated member of the **approval-testing** family:
the same compare-against-a-committed-reference mechanism, differing mainly in
how explicit the human approval step is. See `references/<language>.md` for the
library per language.

## Aligning tests with the implementation

**Test behavior, not internals** — avoid brittle coupling to implementation
details; tests should survive refactors that preserve behavior.

**Right altitude** — pyramid/trophy: most weight on the cheap, fast layers; few
expensive end-to-end tests.

**Keep properties and specs in sync** as code evolves — a property or model that
no longer reflects the code is worse than none.

Test-first is **one valid workflow** — use it when it helps; this skill does not
mandate it.

**One behavior, minimally captured** — for each behavior, find the _smallest_
test that pins it. Too simple and it passes without exercising the behavior; too
broad and it is redundant, brittle, and churns. Aim for a test that fails if and
only if _this_ behavior breaks — favor narrow oracles and inline snapshots over
whole-output dumps.

**Keep end-to-end tests few and stable** — push coverage down the pyramid:
anything an integration test can cover (wiring, contracts, collaborator behavior
against a `devenv.nix`-provisioned dependency) belongs at the integration layer.
Reserve e2e/UI for what is impossible or impractical to test lower — true
full-stack journeys, cross-service flows, browser-rendered behavior. E2E is the
slowest, flakiest layer and a standing tax on the blocking tier, so keep it to a
few high-value journeys and engineer out flakiness (explicit waits over sleeps,
stable selectors, deterministic data); quarantine and fix anything intermittent
at once.

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
