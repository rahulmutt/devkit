# testing-practices Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `testing-practices` skill to the devkit marketplace that acts as a decision framework for choosing the right form of validation (static → unit → integration → property/model/fuzz/mutation → UI → formal methods), with per-language reference docs and all tooling delegated to `developer-environment`.

**Architecture:** A lean `SKILL.md` decision framework plus six `references/` docs (five per-language, one formal-methods). Harness-agnostic prose (actions, never harness-specific tool names) matching the two existing skills. Skills are auto-discovered from `skills/`; the only wiring is adding the skill to the `using-devkit` "Available skills" list. No generator or test changes are required.

**Tech Stack:** Markdown skill files; Deno tooling for verification (`deno task check`, `deno test`, `deno fmt`). Content references libraries across TypeScript/JS, Python, Rust, Go, Haskell, and formal-methods tools (TLA+, Quint, Lean, Coq, Isabelle, Alloy, Dafny, Kani).

## Global Constraints

- Skill files are **harness-agnostic**: describe actions ("run a shell command", "read a file"), never harness tool names. (Verbatim style of `skills/developer-environment/SKILL.md` and `skills/using-devkit/SKILL.md`.)
- **All install/tooling concerns delegate to `developer-environment`** — name the library and idiom; never emit install commands.
- The skill is **TDD-neutral**: mention test-first as one valid workflow; do not mandate it; no hard dependency on superpowers TDD.
- **Integration deps via `devenv.nix`, not Docker** — only exception is a genuine container/Kubernetes-image need.
- Five per-language docs only: `typescript`, `python`, `rust`, `go`, `haskell`. No other languages.
- Go property testing: **rapid is the default**; gopter is the alternative for richer generator/command combinators or its explicit state-machine API.
- Skills are discovered from the `./skills/` directory by the generated manifests — **do not** add per-skill entries to `marketplace.config.ts`.
- Verification gates (must stay green): `deno task check` (drift), `deno test --allow-read --allow-write` (generator tests). Neither is affected by adding skills, so both must remain passing after every task.

---

### Task 1: SKILL.md — the decision framework

**Files:**
- Create: `skills/testing-practices/SKILL.md`

**Interfaces:**
- Consumes: nothing (keystone deliverable).
- Produces: the canonical reference filenames that later tasks must create, linked from SKILL.md's references section — exactly: `references/typescript.md`, `references/python.md`, `references/rust.md`, `references/go.md`, `references/haskell.md`, `references/formal-methods.md`. Later tasks MUST use these exact paths.

- [ ] **Step 1: Create the file with frontmatter + section skeleton**

Create `skills/testing-practices/SKILL.md` with this frontmatter and the seven sections below. Match the terse, imperative voice of `developer-environment/SKILL.md`.

```markdown
---
name: testing-practices
description: Use when deciding how to test or validate code — which form of validation (static checks, unit, integration, property/model/fuzz/mutation, UI, or formal methods), when to reach for each, and how to align it with the implementation. Delegates all tool installation to developer-environment.
---

# Testing Practices

Match the form of validation to the failure mode you are guarding against, and
default to the **cheapest layer that catches the bug class**. Climb the ladder
only when a cheaper layer cannot catch the failure:

`static checks → unit → integration → property / model / fuzz / mutation → UI → formal methods`
```

- [ ] **Step 2: Write the "Static validation" section**

Add a `## Static validation — the base of the pyramid` section stating: linters, formatters, and typecheckers are fast, total, always-on, zero-runtime-cost, and catch whole bug classes (type errors, undefined names, unsafe patterns) before any test runs. Include these exact points:
- Lean on them **hardest in dynamic languages** — a strict typechecker (`mypy`/`pyright`, `tsc --strict`) reclaims the safety a compiler gives statically-typed languages for free.
- Format-on-save + lint-in-CI are non-negotiable hygiene, not optional polish.
- A strict typechecker config is itself a form of spec: keeping types precise and `Any`/`any` out is "aligning validation with the implementation."

- [ ] **Step 3: Write the decision matrix**

Add a `## Decision matrix` section with this exact table:

```markdown
| Type | Catches | Reach for it when | Cost |
|------|---------|-------------------|------|
| Unit | Logic errors in a single unit | Pure logic, branches, edge cases | Low |
| Integration | Wiring/contract errors between components & real deps | Behavior depends on collaborators, DB, services | Medium |
| Property-based | Violated invariants across the input space | A property holds for all inputs (round-trips, idempotence, ordering) | Medium |
| Model-based | Divergence from a reference model over action sequences | Stateful systems with a simpler model; the bridge to formal specs | Medium-High |
| Fuzz | Crashes / panics / UB on malformed input | Parsers, decoders, anything taking untrusted bytes | Medium |
| Mutation | Weak or missing assertions (tests that don't test) | Auditing an existing suite's real strength | High (slow) |
| UI | Broken user-visible flows in a real browser | Critical end-to-end paths through the UI | High |
| Formal verification | Spec violations proven absent | Concurrency, protocols, critical invariants, security (see references/formal-methods.md) | Highest |
```

- [ ] **Step 4: Write the "Aligning tests with the implementation" section**

Add `## Aligning tests with the implementation` with these exact points:
- **Test behavior, not internals** — avoid brittle coupling to implementation details; tests should survive refactors that preserve behavior.
- **Right altitude** — pyramid/trophy: most weight on the cheap, fast layers; few expensive end-to-end tests.
- **Keep properties and specs in sync** as code evolves — a property or model that no longer reflects the code is worse than none.
- Test-first is **one valid workflow** — use it when it helps; this skill does not mandate it.

- [ ] **Step 5: Write the integration / devenv-over-Docker section**

Add `## Integration tests: provision dependencies via devenv.nix` with these exact points:
- Integration tests needing real external services (Postgres, Redis, etc.) should get them from **`devenv.nix`** (delegated to `developer-environment`), not Docker / docker-compose / testcontainers.
- **Why:** tests run in userspace with no daemon and no elevated privileges, and work inside secure sandboxes; `devenv.nix` provisions the service for the dev/test shell.
- Docker is the **exception**, used only when something genuinely requires it — e.g. validating a container image bound for Kubernetes.
- This is the "system service" case `developer-environment`'s mise-first / devenv.nix-fallback rule already covers.

- [ ] **Step 6: Write the tooling-delegation and references sections**

Add `## Installing tools` stating: to install any runner, linter, typechecker, fuzzer, or service, use **`developer-environment`** (mise-pinned, devenv.nix fallback); this skill names the library and idiom and never gives install commands.

Add `## References` linking each doc with one line each, using these exact paths:
- `references/typescript.md`, `references/python.md`, `references/rust.md`, `references/go.md`, `references/haskell.md` — concrete library per role for that language.
- `references/formal-methods.md` — when formal methods earn their cost and which tool fits which problem.

- [ ] **Step 7: Format and verify the file in isolation**

Run: `deno fmt skills/testing-practices/SKILL.md && deno fmt --check skills/testing-practices/SKILL.md`
Expected: formatting applied, then "Checked 1 file" with exit 0.

- [ ] **Step 8: Verify repo guards still pass**

Run: `deno task check && deno test --allow-read --allow-write`
Expected: drift check passes ("no drift"), all generator tests PASS. (Adding a skill does not change generated output.)

- [ ] **Step 9: Commit**

```bash
git add skills/testing-practices/SKILL.md
git commit -m "feat: testing-practices skill — decision framework"
```

---

### Task 2: Per-language reference docs + fmt exclude

**Files:**
- Create: `skills/testing-practices/references/typescript.md`
- Create: `skills/testing-practices/references/python.md`
- Create: `skills/testing-practices/references/rust.md`
- Create: `skills/testing-practices/references/go.md`
- Create: `skills/testing-practices/references/haskell.md`
- Modify: `deno.json` (add `skills/testing-practices/references` to `fmt.exclude`)

**Interfaces:**
- Consumes: the reference filenames defined by Task 1's `## References` section — these five files must exist at exactly those paths.
- Produces: nothing later tasks depend on by signature; formal-methods cross-links in the Rust doc point to `references/formal-methods.md` (Task 3).

Each doc follows one shared template: a frontmatter-free `# <Language> testing` heading, a role→library table, a short "dynamic vs static emphasis" note, an integration-deps redirect, and a closing delegation line. Apply the template five times with the per-language content below.

- [ ] **Step 1: Add the references dir to deno fmt exclude**

In `deno.json`, change the `fmt.exclude` array from:

```json
"fmt": { "exclude": ["assets", "skills/developer-environment/references"] }
```

to:

```json
"fmt": { "exclude": ["assets", "skills/developer-environment/references", "skills/testing-practices/references"] }
```

- [ ] **Step 2: Create `references/typescript.md`**

```markdown
# TypeScript / JavaScript testing

| Role | Library | Idiom |
|------|---------|-------|
| Lint | eslint | `eslint .` in CI; fail on warnings |
| Format | prettier (or `deno fmt`) | format-on-save |
| Typecheck | `tsc --noEmit --strict` | strict mode; ban `any` |
| Unit / integration | vitest (or `node:test`) | `describe` / `it` / `expect` |
| Property-based | fast-check | `fc.assert(fc.property(arb, pred))` |
| Model-based | fast-check commands | `fc.modelRun` with `Command` objects |
| Fuzz | jazzer.js | coverage-guided; `fuzz` entry per target |
| Mutation | Stryker | `stryker run` to audit assertion strength |
| UI | Playwright | `page.goto(...)` / `expect(locator)` |

**Emphasis:** JS is dynamically typed — `tsc --strict` is the single highest-leverage validation layer; treat type errors as build failures.

**Integration deps:** do **not** use `testcontainers`. Provision Postgres/Redis via `devenv.nix` and connect with the plain client (`pg`, `postgres`, `ioredis`).

To install any of these → use the **developer-environment** skill.
```

- [ ] **Step 3: Create `references/python.md`**

```markdown
# Python testing

| Role | Library | Idiom |
|------|---------|-------|
| Lint + format | ruff | `ruff check` + `ruff format` |
| Typecheck | mypy or pyright (strict) | `--strict`; ban implicit `Any` |
| Unit / integration | pytest | `def test_x(): assert ...` |
| Property-based | hypothesis | `@given(strategy)` |
| Model-based | hypothesis | `RuleBasedStateMachine` |
| Fuzz | atheris | libFuzzer-based `TestOneInput` harness |
| Mutation | mutmut (or cosmic-ray) | `mutmut run` to audit assertion strength |
| UI | Playwright for Python | `page.goto(...)` / `expect(locator)` |

**Emphasis:** Python is dynamically typed — a strict typechecker (mypy/pyright) is the single highest-leverage layer and recovers guarantees a compiler would give for free. Run it in CI, not just in the editor.

**Integration deps:** do **not** use `pytest-docker` or `testcontainers`. Provision Postgres/Redis via `devenv.nix` and connect with `psycopg` / `redis-py`.

To install any of these → use the **developer-environment** skill.
```

- [ ] **Step 4: Create `references/rust.md`**

```markdown
# Rust testing

| Role | Library | Idiom |
|------|---------|-------|
| Lint | clippy | `cargo clippy -- -D warnings` |
| Format | rustfmt | `cargo fmt --check` |
| Typecheck | the compiler | the type system already does the heavy lifting |
| Unit / integration | built-in | `#[test]` in-module; `tests/` dir for integration |
| Property-based | proptest (or quickcheck) | `proptest! { ... }` |
| Model-based | proptest-state-machine | reference-model state machine |
| Fuzz | cargo-fuzz | libFuzzer target with `arbitrary` inputs |
| Mutation | cargo-mutants | `cargo mutants` to audit assertion strength |
| Code-level formal | kani | see references/formal-methods.md |

**Emphasis:** the compiler and clippy catch most defect classes statically — invest test budget in property and fuzz tests where the type system can't reach (invariants, untrusted input).

**Integration deps:** do **not** use `testcontainers-rs`. Provision Postgres/Redis via `devenv.nix` and connect with `sqlx` / `tokio-postgres`.

To install any of these → use the **developer-environment** skill.
```

- [ ] **Step 5: Create `references/go.md`**

```markdown
# Go testing

| Role | Library | Idiom |
|------|---------|-------|
| Vet | go vet | `go vet ./...` |
| Format | gofmt | `gofmt -l` (fail if non-empty) |
| Static analysis | staticcheck | `staticcheck ./...` |
| Unit / integration | built-in `testing` | `func TestX(t *testing.T)`; build tags for integration |
| Property-based | rapid (default) | `rapid.Check(t, func(t *rapid.T){...})` |
| Model-based | rapid state machine | `rapid.Run` with a state machine |
| Fuzz | built-in fuzzing | `func FuzzX(f *testing.F)` (`go test -fuzz`) |
| Mutation | go-mutesting | audit assertion strength |
| UI | Playwright-go (or chromedp) | drive a real browser |

**Property choice:** default to **rapid** — native `go test` integration, automatic shrinking, minimal boilerplate. Use **gopter** instead when you need its richer generator/command combinators or its explicit state-machine API.

**Integration deps:** do **not** use `dockertest` or `testcontainers-go`. Provision Postgres/Redis via `devenv.nix` and connect with `pgx`.

To install any of these → use the **developer-environment** skill.
```

- [ ] **Step 6: Create `references/haskell.md`**

```markdown
# Haskell testing

| Role | Library | Idiom |
|------|---------|-------|
| Warnings | GHC | build with `-Wall -Werror` |
| Lint | hlint | `hlint src` |
| Format | ormolu (or fourmolu) | `ormolu --mode check` |
| Typecheck | the compiler | the type system already does the heavy lifting |
| Unit / integration | hspec or tasty | `describe`/`it` (hspec); `testGroup` (tasty) |
| Property-based | QuickCheck or hedgehog | `property $ \x -> ...` |
| Model-based | hedgehog (or quickcheck-state-machine) | state-machine commands |
| Fuzz | hedgehog/QuickCheck byte generators | no mature coverage-guided fuzzer; generate bytes as a property |
| Mutation | mucheck | research-grade; expect limited tooling maturity |

**Emphasis:** the compiler and an exhaustive type model catch most defect classes statically — concentrate runtime testing on properties and stateful models.

**Integration deps:** do **not** reach for Docker. Provision Postgres/Redis via `devenv.nix` and connect with `postgresql-simple` / `hasql`.

To install any of these → use the **developer-environment** skill.
```

- [ ] **Step 7: Verify cross-links and formatting**

Run: `deno fmt --check skills/testing-practices/SKILL.md`
Expected: exit 0 (references dir is now excluded from fmt; SKILL.md still checked).

Run: `for f in typescript python rust go haskell; do test -f skills/testing-practices/references/$f.md && echo "$f OK"; done`
Expected: five `OK` lines — confirms every path linked from SKILL.md's `## References` exists.

- [ ] **Step 8: Verify repo guards still pass**

Run: `deno task check && deno test --allow-read --allow-write`
Expected: drift check passes, all generator tests PASS. (`deno.json` is not a generated file; the drift check covers generated manifests only.)

- [ ] **Step 9: Commit**

```bash
git add skills/testing-practices/references/typescript.md skills/testing-practices/references/python.md skills/testing-practices/references/rust.md skills/testing-practices/references/go.md skills/testing-practices/references/haskell.md deno.json
git commit -m "feat: per-language testing reference docs"
```

---

### Task 3: formal-methods.md

**Files:**
- Create: `skills/testing-practices/references/formal-methods.md`

**Interfaces:**
- Consumes: the `references/formal-methods.md` link from Task 1's SKILL.md and the cross-reference from Task 2's `rust.md`.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Create the file**

```markdown
# Formal methods & specifications

Pointers, not tutorials. To install any tool below → use the **developer-environment** skill.

## When formal methods earn their cost

Reach for them when the state space is too large to test exhaustively and a
counterexample would be expensive in production:

- Concurrency and distributed protocols (interleavings tests won't find).
- Critical invariants that must never be violated.
- Security properties.

Property-based testing is the gateway: the cheapest way to start thinking in
invariants before committing to a heavyweight spec.

## Tool → problem map

| Tool | Best for |
|------|----------|
| TLA+ / Quint | Protocols & concurrency — model-check temporal properties over all interleavings |
| Lean / Coq / Isabelle | Theorem proving for mathematical / logical correctness |
| Alloy | Structural & relational modeling with bounded checking |
| Dafny / Kani | Code-level verification (Kani for Rust) |

## Aligning a spec with the implementation

- **Model-based testing is the bridge:** derive tests from the model and check
  that the implementation conforms.
- **Refinement** is the formal version of the same idea: prove the
  implementation refines the spec.
- Keep the spec in sync as the code evolves — a stale spec gives false
  confidence.
```

- [ ] **Step 2: Verify the formal-methods cross-links resolve**

Run: `grep -l "formal-methods.md" skills/testing-practices/SKILL.md skills/testing-practices/references/rust.md && test -f skills/testing-practices/references/formal-methods.md && echo "links OK"`
Expected: both files listed, then `links OK`.

- [ ] **Step 3: Verify repo guards still pass**

Run: `deno task check && deno test --allow-read --allow-write`
Expected: drift check passes, all generator tests PASS.

- [ ] **Step 4: Commit**

```bash
git add skills/testing-practices/references/formal-methods.md
git commit -m "feat: formal-methods reference (when-to-use + tool map)"
```

---

### Task 4: Wire into using-devkit + full verification

**Files:**
- Modify: `skills/using-devkit/SKILL.md` (the "Available skills" list)

**Interfaces:**
- Consumes: the `testing-practices` skill name and purpose established in Task 1.
- Produces: the final, discoverable skill listing.

- [ ] **Step 1: Add testing-practices to the Available skills list**

In `skills/using-devkit/SKILL.md`, under `## Available skills`, after the `developer-environment` bullet, add:

```markdown
- **testing-practices** — how to decide what to test and how. Use when choosing
  a form of validation (static checks, unit, integration, property/model/fuzz/
  mutation, UI, or formal methods), deciding when to reach for each, and aligning
  it with the implementation. Tool installation delegates to
  developer-environment.
```

- [ ] **Step 2: Format the modified file**

Run: `deno fmt skills/using-devkit/SKILL.md && deno fmt --check skills/using-devkit/SKILL.md`
Expected: formatting applied, then exit 0.

- [ ] **Step 3: Full repo verification**

Run: `deno task check && deno test --allow-read --allow-write`
Expected: drift check passes, all generator tests PASS.

- [ ] **Step 4: Spec-coverage self-check**

Confirm by inspection against `docs/superpowers/specs/2026-06-24-testing-practices-design.md`:
- SKILL.md covers all eight test types + the static layer + alignment + devenv-over-Docker + tooling delegation.
- Five language docs exist, each with a static-validation row and a Docker→devenv redirect.
- `formal-methods.md` has the when-to-use section and the tool→problem map.
- `using-devkit` lists `testing-practices`.

Run: `find skills/testing-practices -type f | sort`
Expected: `SKILL.md` + six `references/*.md` files (typescript, python, rust, go, haskell, formal-methods).

- [ ] **Step 5: Commit**

```bash
git add skills/using-devkit/SKILL.md
git commit -m "feat: list testing-practices in using-devkit"
```

---

## Notes for the implementer

- These are authoring tasks; there is no test-first code cycle. The verification each task ends with is the repo's real gate: `deno task check` (generated-file drift) and `deno test` (generator unit tests), plus targeted fmt/cross-link checks. Adding skills changes neither generated output nor the generator tests, so both must stay green throughout — a failure means something unrelated broke.
- Do not edit `marketplace.config.ts`, the `scripts/` generator, or any generated manifest. Skills are discovered from `./skills/`.
- Keep every skill file harness-agnostic. If you catch yourself naming a harness tool, rewrite as an action.
