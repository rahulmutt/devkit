---
name: writing-clean-code
description: Use when authoring, restructuring, or simplifying code — how to design abstractions, decide what to inline vs. extract, draw module boundaries, name things in the domain's language, delete dead code (YAGNI), apply domain-driven design and hexagonal architecture, and follow each language's canonical style. The guiding principle is code that humans and coding agents can both maintain and evolve long-term. Delegates all tool installation to developer-environment.
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

### Prefer small, modular units

Compose behavior from many small, independently replaceable units rather than a
few large coupled ones — a unit you can understand, test, and swap without
holding the rest in your head. Counter-pull: don't shatter one coherent behavior
into a dozen trivial units that only ever change together — premature
decomposition couples through indirection what was clear inline.

### Domain-driven design

Name things in the domain's language; let module boundaries follow domain
boundaries (bounded contexts), not technical layers alone. Counter-pull: don't
impose heavy tactical DDD patterns on a thin or CRUD domain.

### Explicit boundaries and dependency direction

Sub-components talk through narrow, well-defined interfaces; dependencies point
inward toward the domain. See
[`references/hexagonal-architecture.md`](references/hexagonal-architecture.md).

### Optimize for the next reader (human or agent)

Locality of behavior, explicit over clever, names that make comments redundant.
Counter-pull: don't chase brevity at the cost of legibility — a terse line the
next reader must decode is not optimizing for them.

### Prefer small, isolated files

One unit per file; keep files small enough to hold in a context window, and
isolated enough that one file's internals aren't entangled with another's.
Counter-pull: don't fragment so far that following one behavior means opening
ten files — locality matters as much as size.

### Every line is a liability

Every line added is a line to read, test, and maintain — the cheapest code is
the code you don't write, so reach for the simplest thing that works (YAGNI).
When code is reachable from no code path and you are _absolutely sure_, delete
it; dead code misleads the next reader. Counter-pull: "unused" is easy to get
wrong — check for reflection, dynamic dispatch, public API surface, feature
flags, and external callers before deleting. When unsure, leave it and flag it.

## Coding style

Style is mostly language-specific — follow the language's canonical style guide
and let its formatter and linter be the source of truth, rather than
hand-policing what a formatter already enforces. See the per-language references
below for the canonical guide, formatter, linter, and key idioms for each
supported language.

## Boundaries with sibling skills

- Formatter / linter installation → **`developer-environment`** (mise-pinned,
  devenv.nix fallback). This skill names the style guide and idiom and never
  gives install commands.
- Counterpart skill for _validating_ code: `testing-practices` (this skill is
  the _authoring_ counterpart).

## References

- [`references/hexagonal-architecture.md`](references/hexagonal-architecture.md)
  — ports & adapters, the dependency rule, and when it earns its cost vs.
  over-engineering.
- Per-language canonical style guide, formatter, linter, and idioms:
  [`references/typescript.md`](references/typescript.md),
  [`references/python.md`](references/python.md),
  [`references/rust.md`](references/rust.md),
  [`references/go.md`](references/go.md),
  [`references/haskell.md`](references/haskell.md).
