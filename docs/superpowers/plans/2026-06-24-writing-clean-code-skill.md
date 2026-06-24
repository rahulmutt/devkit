# writing-clean-code Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `writing-clean-code` skill to the devkit marketplace: a thin, language-agnostic design-principles core plus per-language style references and a hexagonal-architecture reference.

**Architecture:** Mirror the existing `testing-practices` skill exactly — `SKILL.md` carries the judgment-oriented principles ("principle + tension"), and `references/` carries per-language depth and the hexagonal deep-dive. All tooling installation delegates to `developer-environment`; the skill never emits install commands. Generated marketplace manifests are driven by `marketplace.config.ts` and enumerate `./skills/` as a directory, so **no manifest regeneration is required** when adding a skill — the only integration touchpoints are the `using-devkit` listing and the `deno.json` fmt exclude.

**Tech Stack:** Markdown skill files; Deno 2.1.4 toolchain (`deno fmt`, `deno task check`, `deno task test`).

## Global Constraints

- **Harness-agnostic:** describe actions ("read a file", "run a shell command"), never harness-specific tool names. Match `testing-practices`, `developer-environment`, and `using-devkit`.
- **No install commands:** the skill names style guides, formatters, linters, and idioms; it routes every installation to `developer-environment`. Verbatim closing line on reference docs: `To install any of these → use the **developer-environment** skill.`
- **Frontmatter:** every `SKILL.md` has exactly `name:` and `description:` keys (no others), matching sibling skills.
- **Formatting:** `SKILL.md` MUST pass `deno fmt --check`. Files under `skills/writing-clean-code/references/` are exempt from fmt (added to `deno.json` `fmt.exclude` in Task 7), matching the sibling skills.
- **Drift gate stays green:** `deno task check` and `deno task test` must pass unchanged after every commit.
- **Sibling parity:** the new skill's tone, header depth, and table style match `skills/testing-practices/`.

---

### Task 1: SKILL.md — the design-principles core

**Files:**
- Create: `skills/writing-clean-code/SKILL.md`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: the core skill file. Later tasks add files it links to: `references/hexagonal-architecture.md` and `references/{typescript,python,rust,go,haskell}.md`. The frontmatter `name:` value is `writing-clean-code` — Task 7's `using-devkit` listing must match this exactly.

- [ ] **Step 1: Create the skill file**

Create `skills/writing-clean-code/SKILL.md` with this exact frontmatter and the structure below.

Frontmatter:

```markdown
---
name: writing-clean-code
description: Use when authoring or restructuring code — how to design abstractions, decide what to inline vs. extract, draw module boundaries, apply domain-driven design and hexagonal architecture, and follow each language's canonical style. The guiding principle is code that humans and coding agents can both maintain and evolve long-term. Delegates all tool installation to developer-environment.
---
```

Body sections, in order:

1. **`# Writing Clean Code`** heading, then a 2–3 sentence north-star paragraph: code should be easy for both humans and coding agents to maintain and evolve long-term; optimize every authoring decision for the next reader, who is often an agent with a bounded context window; legibility and locality serve both audiences at once.

2. **`## Principles — each with its counter-pull`** section. Introduce one sentence explaining the framing: each principle names the failure it prevents *and* the over-application it guards against, so neither humans nor agents apply it mechanically. Then the six principles, each as a `###` subsection of 2–4 sentences:

   - **`### Abstract real duplication, not speculative duplication`** — DRY when the same *decision* repeats; tolerate incidental similarity. Rule of three over premature generalization. Counter-pull: a wrong abstraction costs more than the duplication it removed.
   - **`### Inline the single-use and simple; name the reused or complex`** — collapse a variable or helper used once that adds no clarifying value; extract when it is reused or when the name documents intent. The test is *does the name earn its keep*, not line count.
   - **`### One purpose per unit`** — a module, function, or file should have a single reason to change. Growing size is the smell that surfaces a violation, not the violation itself.
   - **`### Domain-driven design`** — name things in the domain's language; let module boundaries follow domain boundaries (bounded contexts), not technical layers alone. Counter-pull: don't impose heavy tactical DDD patterns on a thin or CRUD domain.
   - **`### Explicit boundaries and dependency direction`** — sub-components talk through narrow, well-defined interfaces; dependencies point inward toward the domain. End with: see [`references/hexagonal-architecture.md`](references/hexagonal-architecture.md).
   - **`### Optimize for the next reader (human or agent)`** — locality of behavior, explicit over clever, small focused files that fit in a context window, names that make comments redundant. Counter-pull: don't fragment so far that following one behavior means opening ten files.

3. **`## Coding style`** section: 2–3 sentences. Style is mostly language-specific — follow the language's canonical style guide and let its formatter and linter be the source of truth, rather than hand-policing what a formatter already enforces. Point to the per-language references.

4. **`## Installing tools`** section: 2 sentences mirroring `testing-practices` — to install any formatter or linter, use **`developer-environment`** (mise-pinned, devenv.nix fallback); this skill names the style guide and idiom and never gives install commands.

5. **`## References`** section: a bullet list linking each reference doc with a one-line purpose:
   - [`references/hexagonal-architecture.md`](references/hexagonal-architecture.md) — ports & adapters, the dependency rule, and when it earns its cost vs. over-engineering.
   - [`references/typescript.md`](references/typescript.md) — canonical style guide, formatter/linter, and key idioms for TypeScript.
   - [`references/python.md`](references/python.md) — same, for Python.
   - [`references/rust.md`](references/rust.md) — same, for Rust.
   - [`references/go.md`](references/go.md) — same, for Go.
   - [`references/haskell.md`](references/haskell.md) — same, for Haskell.

End with one line noting the sibling skill: the counterpart for *validating* code is `testing-practices`.

- [ ] **Step 2: Verify formatting passes**

Run: `deno fmt --check skills/writing-clean-code/SKILL.md`
Expected: `Checked 1 file` and exit 0. If it reports a diff, run `deno fmt skills/writing-clean-code/SKILL.md` and re-check.

- [ ] **Step 3: Verify the drift gate stays green**

Run: `deno task check`
Expected: `✓ all N generated files in sync` and exit 0 (the count is unchanged from before this task — adding a skill does not change generated manifests).

- [ ] **Step 4: Commit**

```bash
git add skills/writing-clean-code/SKILL.md
git commit -m "feat: writing-clean-code skill — design principles core"
```

---

### Task 2: references/hexagonal-architecture.md

**Files:**
- Create: `skills/writing-clean-code/references/hexagonal-architecture.md`

**Interfaces:**
- Consumes: linked from `SKILL.md`'s "Explicit boundaries" principle and References list (Task 1).
- Produces: the hexagonal deep-dive. No later task depends on its internals.

- [ ] **Step 1: Create the reference doc**

Create `skills/writing-clean-code/references/hexagonal-architecture.md` (no frontmatter — reference docs are plain markdown, matching `testing-practices/references/*`). Required sections:

1. **`# Hexagonal architecture (ports & adapters)`** heading + one-paragraph summary: isolate a domain core from the outside world so the core depends on nothing external.

2. **`## The pieces`** — define, one short paragraph or bullet each:
   - **Domain core** — business logic and domain types; no I/O, no framework imports.
   - **Ports** — interfaces the core *owns*: driving/inbound ports (what the core offers) and driven/outbound ports (what the core needs, e.g. a `Repository`).
   - **Adapters** — concrete implementations at the edge: driving adapters (HTTP handler, CLI) call inbound ports; driven adapters (a Postgres repository) implement outbound ports.

3. **`## The dependency rule`** — adapters depend on the core; the core never depends on adapters. Dependencies point inward. The core defines the outbound port interface; the adapter implements it (dependency inversion).

4. **`## A small example`** — a compact, language-neutral sketch (pseudocode or one short language is fine, kept minimal) showing: a core service depending on an `OrderRepository` port, with a Postgres adapter implementing it and an HTTP adapter driving the service. Keep it under ~20 lines.

5. **`## When it earns its cost`** — rich domains, churning or swappable external dependencies, multiple delivery mechanisms, or a need to test the core in isolation without real I/O.

6. **`## When it is over-engineering`** — thin/CRUD domains, scripts, and prototypes, where the indirection adds ceremony without payoff. State this explicitly, mirroring the "cheapest that works" stance of `testing-practices`.

7. Closing line: `To install any tooling → use the **developer-environment** skill.`

- [ ] **Step 2: Verify the drift gate stays green**

Run: `deno task check`
Expected: `✓ all N generated files in sync`, exit 0. (References are fmt-exempt, so no `deno fmt` step here — the exclude is added in Task 7; do not run `deno fmt --check` on this file.)

- [ ] **Step 3: Commit**

```bash
git add skills/writing-clean-code/references/hexagonal-architecture.md
git commit -m "feat: hexagonal-architecture reference (ports & adapters + when-to-use)"
```

---

### Task 3: Per-language style references (×5)

**Files:**
- Create: `skills/writing-clean-code/references/typescript.md`
- Create: `skills/writing-clean-code/references/python.md`
- Create: `skills/writing-clean-code/references/rust.md`
- Create: `skills/writing-clean-code/references/go.md`
- Create: `skills/writing-clean-code/references/haskell.md`

**Interfaces:**
- Consumes: linked from `SKILL.md` References list (Task 1).
- Produces: the five per-language style docs. No later task depends on their internals.

Each file follows one template (no frontmatter):

```
# <Language> style

| Concern | Choice | Idiom |
|---------|--------|-------|
| Style guide | <canonical guide> | <how it's applied> |
| Format | <formatter> | <invocation idiom> |
| Lint | <linter> | <invocation idiom> |

**Idioms not auto-enforced:**
- <2–4 high-value bullets: naming, error handling, module/boundary organization, API shape>

To install any of these → use the **developer-environment** skill.
```

Do **not** restate style the formatter already enforces (indentation, quote style, line width). Only call out judgment-level idioms a formatter cannot apply.

- [ ] **Step 1: Create `typescript.md`**

Content:
- Style guide: no single dominant guide — the formatter + linter config is the source of truth; pair with `tsc --strict`.
- Format: Prettier — `prettier --check`.
- Lint: ESLint — `eslint .` (typed lint rules where available).
- Idioms: prefer discriminated unions over boolean flags; avoid `any` (reach for `unknown` + narrowing); model domain values as branded/opaque types rather than bare `string`/`number`; keep module boundaries explicit and use barrel `index.ts` files sparingly.

- [ ] **Step 2: Create `python.md`**

Content:
- Style guide: PEP 8 (with PEP 257 for docstrings).
- Format: ruff formatter — `ruff format --check`.
- Lint: ruff — `ruff check`; pair with a strict typechecker (`mypy`/`pyright`).
- Idioms: `@dataclass`/`frozen` for value objects; raise explicit exceptions over sentinel return values; `snake_case` functions / `PascalCase` classes; define module boundaries with `__all__` and keep public surface small.

- [ ] **Step 3: Create `rust.md`**

Content:
- Style guide: Rust API Guidelines + Rust Style Guide.
- Format: rustfmt — `cargo fmt --check`.
- Lint: clippy — `cargo clippy -- -D warnings`.
- Idioms: newtypes for domain values (`struct UserId(u64)`); `Result` + `?` over panics in library code; modules mirror domain boundaries; conversions via `From`/`TryFrom` and construction via builders where it clarifies intent.

- [ ] **Step 4: Create `go.md`**

Content:
- Style guide: Effective Go + Google Go Style Guide.
- Format: gofmt — `gofmt -l .` (or `go fmt ./...`).
- Lint: staticcheck — `staticcheck ./...` (with `go vet`).
- Idioms: accept interfaces, return structs; define small interfaces at the consumer, not the producer; errors as values with `%w` wrapping; one package per responsibility, named for what it provides.

- [ ] **Step 5: Create `haskell.md`**

Content:
- Style guide: community style (e.g. the Haskell Style Guide); types-first design.
- Format: ormolu or fourmolu — `fourmolu --mode check`.
- Lint: hlint — `hlint .`.
- Idioms: make illegal states unrepresentable with precise types; newtypes for domain values; smart constructors that enforce invariants; module export lists as the boundary (export the type, hide the constructor when invariants matter).

- [ ] **Step 6: Verify the drift gate stays green**

Run: `deno task check`
Expected: `✓ all N generated files in sync`, exit 0.

- [ ] **Step 7: Commit**

```bash
git add skills/writing-clean-code/references/typescript.md skills/writing-clean-code/references/python.md skills/writing-clean-code/references/rust.md skills/writing-clean-code/references/go.md skills/writing-clean-code/references/haskell.md
git commit -m "feat: per-language style references for writing-clean-code"
```

---

### Task 4: Marketplace integration

**Files:**
- Modify: `skills/using-devkit/SKILL.md` (the "Available skills" list)
- Modify: `deno.json` (`fmt.exclude` array)

**Interfaces:**
- Consumes: the `name: writing-clean-code` value from Task 1; the existing fmt-exclude entries in `deno.json` (`skills/developer-environment/references`, `skills/testing-practices/references`).
- Produces: the final wired-up marketplace. Terminal task.

- [ ] **Step 1: Add the skill to the using-devkit listing**

In `skills/using-devkit/SKILL.md`, under `## Available skills`, append a new bullet after the `testing-practices` entry (keep the existing two entries unchanged):

```markdown
- **writing-clean-code** — how to author and structure code so humans and coding
  agents can both maintain it long-term. Use when designing abstractions,
  deciding what to inline vs. extract, drawing module boundaries, applying DDD or
  hexagonal architecture, or following a language's canonical style. The
  authoring counterpart to **testing-practices**; tool installation delegates to
  developer-environment.
```

- [ ] **Step 2: Exempt the new references from formatting**

In `deno.json`, add `"skills/writing-clean-code/references"` to the `fmt.exclude` array so the result reads:

```json
  "fmt": { "exclude": ["assets", "skills/developer-environment/references", "skills/testing-practices/references", "skills/writing-clean-code/references"] }
```

- [ ] **Step 3: Verify formatting passes for edited tracked files**

Run: `deno fmt --check skills/using-devkit/SKILL.md deno.json`
Expected: `Checked 2 files`, exit 0. If a diff is reported, run `deno fmt skills/using-devkit/SKILL.md deno.json` and re-check.

- [ ] **Step 4: Run the full gate suite**

Run: `deno task check && deno task test`
Expected: `✓ all N generated files in sync`, then the generator test suite reports `ok` with `0 failed`. Both exit 0.

- [ ] **Step 5: Confirm whole-tree formatting is clean**

Run: `deno fmt --check`
Expected: exit 0 (the new `references/` dir is now excluded; `SKILL.md` files and `deno.json` are clean).

- [ ] **Step 6: Commit**

```bash
git add skills/using-devkit/SKILL.md deno.json
git commit -m "feat: list writing-clean-code in using-devkit; exempt its references from fmt"
```

---

## Self-Review

**Spec coverage:**
- Purpose / north star (humans + agents, long-term) → Task 1 §1.
- Principle + tension framing, six principles → Task 1 §2.
- Coding style = language-specific, formatter as source of truth → Task 1 §3 + Task 3.
- Hexagonal as a dedicated reference incl. "when over-engineering" → Task 2.
- Five per-language references with style guide + formatter/linter + non-obvious idioms → Task 3.
- Tooling delegation to developer-environment, no install commands → Global Constraints + Task 1 §4 + every reference's closing line.
- Harness-agnostic style → Global Constraints.
- using-devkit listing → Task 4 Step 1.
- Drift/consistency guards pass; no manifest registration needed beyond the listing → confirmed in Architecture; verified in Tasks 1–4.
- fmt parity with siblings (references excluded) → Task 4 Step 2.

**Placeholder scan:** No "TBD"/"similar to"/"add error handling" placeholders — each task gives the concrete sections and the actual idiom bullets to write.

**Type/name consistency:** The skill `name:` is `writing-clean-code` in Task 1 and referenced identically in Task 4. Reference filenames (`hexagonal-architecture.md`, `typescript.md`, `python.md`, `rust.md`, `go.md`, `haskell.md`) match between the `SKILL.md` links (Task 1 §5) and the create paths (Tasks 2–3). The reference closing line is identical wording everywhere.
