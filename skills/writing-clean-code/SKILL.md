---
name: writing-clean-code
description: Use when authoring or restructuring code — how to design abstractions, decide what to inline vs. extract, draw module boundaries, apply domain-driven design and hexagonal architecture, and follow each language's canonical style. The guiding principle is code that humans and coding agents can both maintain and evolve long-term. Delegates all tool installation to developer-environment.
---

# Writing Clean Code

Code should be easy for both humans and coding agents to maintain and evolve
long-term. Optimize every authoring decision for the next reader, who is often
an agent with a bounded context window — legibility and locality serve both
audiences at once.

## Principles — each with its counter-pull

Each principle names the failure it prevents _and_ the over-application it
guards against, so neither humans nor agents apply it mechanically.

### Abstract real duplication, not speculative duplication

DRY when the same _decision_ repeats; tolerate incidental similarity. Prefer the
rule of three over premature generalization — wait for a third repetition before
reaching for an abstraction. Counter-pull: a wrong abstraction costs more than
the duplication it removed.

### Inline the single-use and simple; name the reused or complex

Collapse a variable or helper used once that adds no clarifying value; extract
when it is reused or when the name documents intent. The test is _does the name
earn its keep_, not line count.

### One purpose per unit

A module, function, or file should have a single reason to change. Growing size
is the smell that surfaces a violation, not the violation itself.

### Domain-driven design

Name things in the domain's language; let module boundaries follow domain
boundaries (bounded contexts), not technical layers alone. Counter-pull: don't
impose heavy tactical DDD patterns on a thin or CRUD domain.

### Explicit boundaries and dependency direction

Sub-components talk through narrow, well-defined interfaces; dependencies point
inward toward the domain. See
[`references/hexagonal-architecture.md`](references/hexagonal-architecture.md).

### Optimize for the next reader (human or agent)

Locality of behavior, explicit over clever, small focused files that fit in a
context window, names that make comments redundant. Counter-pull: don't fragment
so far that following one behavior means opening ten files.

## Coding style

Style is mostly language-specific — follow the language's canonical style guide
and let its formatter and linter be the source of truth, rather than
hand-policing what a formatter already enforces. See the per-language references
below for the canonical guide, formatter, linter, and key idioms for each
supported language.

## Installing tools

To install any formatter or linter, use **`developer-environment`**
(mise-pinned, devenv.nix fallback). This skill names the style guide and idiom
and never gives install commands.

## References

- [`references/hexagonal-architecture.md`](references/hexagonal-architecture.md)
  — ports & adapters, the dependency rule, and when it earns its cost vs.
  over-engineering.
- [`references/typescript.md`](references/typescript.md) — canonical style
  guide, formatter/linter, and key idioms for TypeScript.
- [`references/python.md`](references/python.md) — same, for Python.
- [`references/rust.md`](references/rust.md) — same, for Rust.
- [`references/go.md`](references/go.md) — same, for Go.
- [`references/haskell.md`](references/haskell.md) — same, for Haskell.

The counterpart skill for _validating_ code is `testing-practices`.
