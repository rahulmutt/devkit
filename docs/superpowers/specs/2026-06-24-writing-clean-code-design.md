# writing-clean-code skill — design

**Date:** 2026-06-24
**Status:** Approved (brainstorming)
**Marketplace:** devkit

## Purpose

Add a `writing-clean-code` skill to the devkit marketplace. Where
`testing-practices` decides *how to validate* code, this skill guides how to
*craft* it — abstractions, modularity, boundaries, domain modeling, and
language-specific style — so the result is **easy for both humans and coding
agents to maintain and evolve over the long term**.

That dual audience is the skill's distinctive thread: code with good locality,
explicit boundaries, and small focused units is exactly what a coding agent edits
reliably, not just what a human reads easily. The two goals reinforce each other.

It mirrors the sibling skill's shape: a thin, language-agnostic principles core
(`SKILL.md`) plus per-language depth in `references/`. Tooling installation is
delegated to `developer-environment`; this skill names style guides and idioms,
never install commands.

## Non-goals (YAGNI)

- Code review / bug-finding — that is a separate concern (see existing review and
  simplify skills); this skill is about authoring, not auditing.
- Test selection — delegated to `testing-practices`.
- Exhaustive style-guide reproduction — point to the canonical guide; do not
  restate what a formatter already enforces.
- Installation commands — always delegate to `developer-environment`.
- Languages beyond the five below (mirrors `testing-practices`; others can follow
  the same template later).
- A rigid, mechanically-applied rule list — the framing deliberately resists
  over-application (see "Core framing").

## File layout

```
skills/writing-clean-code/
├── SKILL.md                         # language-agnostic design principles (core)
└── references/
    ├── hexagonal-architecture.md    # ports & adapters, dependency rule, when it earns its cost
    ├── typescript.md                # canonical style guide + formatter/linter + key idioms
    ├── python.md
    ├── rust.md
    ├── go.md
    └── haskell.md
```

Style: harness-agnostic throughout — actions ("read a file", "run a shell
command"), never harness-specific tool names — matching `developer-environment`,
`testing-practices`, and `using-devkit`.

## SKILL.md content

### 1. North star (stance)

Code should be easy for both humans and coding agents to maintain and evolve over
the long term. Optimize every authoring decision for the next reader — and the
next reader is often an agent with a bounded context window.

### 2. Core framing: principle + tension

Each principle is stated as a **pull and its counter-pull**, so neither humans nor
agents mechanically over-apply it. This is the deliberate analogue of
`testing-practices`'s "cheapest layer that works" judgment stance — it teaches
when *not* to apply a principle, not just when to.

Principles:

1. **Abstract real duplication, not speculative duplication.** DRY when the same
   *decision* repeats; tolerate incidental similarity. Rule of three over
   premature generalization. Counter-pull: a wrong abstraction is more expensive
   than duplication.
2. **Inline the single-use and simple; name the reused or complex.** Collapse a
   variable/helper used once that adds no clarifying value; extract when it is
   reused or when the name documents intent. The test is *does the name earn its
   keep*, not line count.
3. **One purpose per unit.** A module/function/file should have a single reason to
   change. Growing size is the smell that surfaces a violation, not the violation
   itself.
4. **Domain-driven design.** Name things in the domain's language; let module
   boundaries follow domain boundaries (bounded contexts), not technical layers
   alone. Counter-pull: don't impose heavy DDD tactical patterns on a thin/CRUD
   domain.
5. **Explicit boundaries & dependency direction.** Sub-components communicate
   through narrow, well-defined interfaces; dependencies point inward toward the
   domain. Points to `references/hexagonal-architecture.md`.
6. **Optimize for the next reader (human or agent).** Locality of behavior,
   explicit over clever, small focused files that fit in a context window, names
   that make comments redundant. Counter-pull: don't fragment so far that
   following one behavior requires opening ten files.

### 3. Tooling delegation

Formatters and linters that enforce style install via `developer-environment`
(mise-pinned, devenv.nix fallback). This skill names the style guide and the
idiom; it never gives install commands.

### 4. References pointer

For dependency-direction depth, read `references/hexagonal-architecture.md`. For
the concrete style guide + idioms of a language, read
`references/<language>.md`. The sibling skill for validation is
`testing-practices`.

## references/hexagonal-architecture.md

- **The pattern:** domain core; ports (interfaces the core owns); adapters
  (driving/inbound and driven/outbound). A small concrete example.
- **The dependency rule:** adapters depend on the core; the core never depends on
  adapters. Dependencies point inward.
- **When it earns its cost:** rich domains, churning external dependencies,
  multiple delivery mechanisms, or a need to test the core in isolation.
- **When it is over-engineering:** thin/CRUD domains, scripts, prototypes — say so
  explicitly, mirroring the "cheapest that works" stance.
- Pointer(s) to learn more; tooling install → `developer-environment`.

## Per-language reference docs (×5)

Each of `typescript.md`, `python.md`, `rust.md`, `go.md`, `haskell.md` contains:

- The **canonical style guide** for the language.
- The **formatter + linter** that enforce it.
- **2–4 high-value idioms not auto-enforced** by the formatter (naming, error
  handling, module organization, API shape).
- A closing "to install → `developer-environment`" line.
- It does **not** restate style the formatter already enforces.

Indicative (not exhaustive) recommendations:

- **TypeScript/JS:** Prettier (format) + ESLint (lint) + `tsc --strict`; no single
  dominant style guide — lean on the formatter/linter config as the style source
  of truth. Idioms: prefer `type`/narrow unions, discriminated unions over flags,
  no `any`, explicit module boundaries via index barrels used sparingly.
- **Python:** PEP 8 as the canonical guide; ruff (format + lint). Idioms: snake
  naming, dataclasses/`@dataclass` for value objects, explicit exceptions over
  sentinel returns, `__all__`/module layout for boundaries.
- **Rust:** Rust API Guidelines + `rustfmt`; clippy. Idioms: newtypes for domain
  values, `Result` + `?` over panics, modules mirroring domain boundaries,
  builder/`From` conventions.
- **Go:** Effective Go + Google Go Style Guide; gofmt + staticcheck. Idioms:
  accept interfaces / return structs, errors-as-values with wrapping, small
  interfaces defined at the consumer, package-per-responsibility.
- **Haskell:** ormolu/fourmolu (format) + hlint; community style. Idioms: types
  first / make illegal states unrepresentable, newtypes for domain values,
  smart constructors, module export lists as boundaries.

## Integration with the marketplace

- Update `skills/using-devkit/SKILL.md` "Available skills" to list
  `writing-clean-code` with a one-line description, noting it is the authoring
  counterpart to `testing-practices`.
- Verify the marketplace drift/consistency guards (pre-commit) pick up the new
  skill cleanly; regenerate any per-harness artifacts if generation requires it.
- Skills are discovered from `skills/`; confirm no explicit registration is needed
  in `marketplace.config.ts` beyond the `using-devkit` listing.

## Success criteria

- An agent invoking `writing-clean-code` can decide how to structure code for a
  given task — when to abstract, inline, split, or apply hexagonal boundaries —
  without leaving SKILL.md, and understands when *not* to apply each principle.
- For any of the five languages, the agent can find the canonical style guide,
  the enforcing formatter/linter, and a few non-obvious idioms in one reference
  doc.
- The agent never emits install commands from this skill — it routes to
  `developer-environment`.
- Hexagonal guidance includes an explicit "when it is over-engineering" case.
- The new skill passes the marketplace's existing drift/consistency checks.
