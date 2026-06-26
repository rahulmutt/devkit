# testing-practices Skill Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing `testing-practices` skill with golden/oracle
testing, the fault-injection spectrum (DST / Jepsen / chaos, incl. Antithesis &
Bombadil), a minimal-test ("Goldilocks") principle, e2e discipline, and a
test-suite-maintenance/velocity section.

**Architecture:** Pure Markdown edits to one skill. `SKILL.md` gains 3 matrix
rows + 3 new prose sections + 2 in-section paragraphs;
`references/formal-methods.md` broadens to cover simulation/fault-injection; the
5 per-language reference docs each gain golden-test and (where applicable)
DST/Antithesis rows. No code, no new files, no frontmatter changes.

**Tech Stack:** Markdown; Deno tasks for verification (`deno fmt`,
`deno task ci`).

## Global Constraints

- **No install commands** anywhere — this skill names libraries/idioms and
  routes all installation to the `developer-environment` skill. Keep the
  existing "To install … → developer-environment" lines intact.
- **Harness-agnostic prose** — actions ("run a shell command"), never
  harness-specific tool names.
- **Do not touch frontmatter** — `name: testing-practices` and the
  `description:` (must keep its `Use when …` prefix) stay exactly as-is. The
  skill linter requires `name` == directory and a `Use when`-prefixed
  description.
- **`SKILL.md` is formatted by `deno fmt`; `references/` is excluded.** After
  any `SKILL.md` edit, run `deno fmt` on it so column alignment / spacing
  matches, then `deno task fmt-check` must pass. Reference docs are fmt-excluded
  — do not hand-fight their alignment, but keep tables valid.
- **Never blind-accept generated output.** If `deno task check` (drift) ever
  flags regeneration, run `deno task generate` and commit the result; do not
  hand-edit generated harness outputs.
- Pinned toolchain: deno 2.1.4, node 22.11.0 (`mise.toml`). Run all
  `deno task …` from the repo root `/workspace`, not from a worktree (a worktree
  under `.claude/worktrees/` causes false `fmt-check` failures from main).
- Spec: `docs/superpowers/specs/2026-06-26-testing-practices-update-design.md`.

---

### Task 1: SKILL.md — ladder line + three decision-matrix rows

**Files:**

- Modify: `skills/testing-practices/SKILL.md` (ladder line ~12; matrix rows ~33
  and ~39)

**Interfaces:**

- Consumes: nothing.
- Produces: matrix row labels `Golden / snapshot`, `Simulation / DST`,
  `Chaos / resilience` and the ladder token `simulation (DST)`, referenced by
  later tasks and reference docs.

- [ ] **Step 1: Add `simulation (DST)` to the ladder line**

Replace the ladder line:

```
`static checks → unit → integration → property / model / fuzz / mutation → UI → formal methods`
```

with:

```
`static checks → unit → integration → property / model / fuzz / mutation → simulation (DST) → UI → formal methods`
```

- [ ] **Step 2: Insert the Golden / snapshot row after the `Unit` row**

After this existing row:

```
| Unit                | Logic errors in a single unit                           | Pure logic, branches, edge cases                                                         | Low         |
```

add:

```
| Golden / snapshot   | Unintended changes to large structured output           | Stable, reviewable serialized output (codegen, CLI, AST/IR, API JSON, render trees)      | Low         |
```

- [ ] **Step 3: Insert Simulation/DST and Chaos rows after the `UI` row**

After this existing row:

```
| UI                  | Broken user-visible flows in a real browser             | Critical end-to-end paths through the UI                                                 | High        |
```

add:

```
| Simulation / DST    | Heisenbugs from timing, faults, interleavings           | Distributed/concurrent systems where reproducibility is the core problem (see `references/formal-methods.md`) | High |
| Chaos / resilience  | Availability/resilience failures under real faults      | Validating a live distributed system stays up and degrades gracefully                    | High        |
```

- [ ] **Step 4: Normalize formatting**

Run: `deno fmt skills/testing-practices/SKILL.md` (This realigns the matrix
columns automatically — do not hand-align.)

- [ ] **Step 5: Verify formatting and skill lint pass**

Run: `deno task fmt-check && deno task lint-skills` Expected: both PASS, no
output errors.

- [ ] **Step 6: Commit**

```bash
git add skills/testing-practices/SKILL.md
git commit -m "feat(testing-practices): add golden/DST/chaos matrix rows + simulation in ladder"
```

---

### Task 2: SKILL.md — "Choosing a test oracle" + "Golden / snapshot tests" sections

**Files:**

- Modify: `skills/testing-practices/SKILL.md` (insert two `##` sections
  immediately before `## Aligning tests with the implementation`)

**Interfaces:**

- Consumes: the `Golden / snapshot` matrix row label from Task 1.
- Produces: the oracle vocabulary (specified / recorded / derived / invariant)
  and the golden-test guidance referenced by Task 3's "Goldilocks" paragraph and
  by the per-language reference docs.

- [ ] **Step 1: Insert both sections before the Aligning-tests heading**

Find this existing heading line:

```
## Aligning tests with the implementation
```

Insert the following two sections immediately **before** it (leave one blank
line between the inserted block and the heading):

```
## Choosing a test oracle

The **oracle** is how a test decides pass/fail. Pick it by what you can know
about the correct answer:

- **Specified** — assert the exact expected value. Use when you know the answer.
- **Recorded** — golden / snapshot: capture a known-good output and diff future
  runs against it. Use when the answer is stable but tedious to hand-write.
- **Derived** — compare against another oracle you trust: **differential**
  testing (run a reference or previous implementation on the same input and
  compare outputs) or **metamorphic** testing (assert relations between outputs).
  Use when you cannot state the answer but can compare.
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
the same compare-against-a-committed-reference mechanism, differing mainly in how
explicit the human approval step is. See `references/<language>.md` for the
library per language.
```

- [ ] **Step 2: Normalize formatting**

Run: `deno fmt skills/testing-practices/SKILL.md`

- [ ] **Step 3: Verify**

Run: `deno task fmt-check && deno task lint-skills` Expected: both PASS.

- [ ] **Step 4: Commit**

```bash
git add skills/testing-practices/SKILL.md
git commit -m "feat(testing-practices): add test-oracle and golden/snapshot sections"
```

---

### Task 3: SKILL.md — Goldilocks + e2e paragraphs in "Aligning tests"

**Files:**

- Modify: `skills/testing-practices/SKILL.md` (append two paragraphs to the end
  of the `## Aligning tests with the implementation` section)

**Interfaces:**

- Consumes: "Right altitude" bullet (existing) and golden-test guidance from
  Task 2.
- Produces: the e2e discipline and minimal-test principle referenced by Task 4's
  maintenance section ("right altitude" / flakiness cross-links).

- [ ] **Step 1: Append the two paragraphs after the last bullet of the section**

Find this existing paragraph (the last content in the section, before
`## Integration tests: provision dependencies via devenv.nix`):

```
Test-first is **one valid workflow** — use it when it helps; this skill does not
mandate it.
```

Replace it with that same paragraph followed by the two new paragraphs:

```
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
```

- [ ] **Step 2: Normalize formatting**

Run: `deno fmt skills/testing-practices/SKILL.md`

- [ ] **Step 3: Verify**

Run: `deno task fmt-check && deno task lint-skills` Expected: both PASS.

- [ ] **Step 4: Commit**

```bash
git add skills/testing-practices/SKILL.md
git commit -m "feat(testing-practices): add minimal-test (Goldilocks) and e2e-discipline guidance"
```

---

### Task 4: SKILL.md — "Test suite maintenance & developer velocity" section + references pointer

**Files:**

- Modify: `skills/testing-practices/SKILL.md` (insert one `##` section before
  `## Integration tests: provision dependencies via devenv.nix`; update the
  `formal-methods.md` reference bullet)

**Interfaces:**

- Consumes: tiering vocabulary (pre-commit / PR-CI / nightly), the flakiness and
  right-altitude ideas from Task 3.
- Produces: nothing downstream.

- [ ] **Step 1: Insert the maintenance section before the Integration-tests
      heading**

Find this existing heading line:

```
## Integration tests: provision dependencies via devenv.nix
```

Insert the following section immediately **before** it (one blank line
separating them):

```
## Test suite maintenance & developer velocity

A test suite is a standing liability as well as an asset: it costs wall-clock on
every change and erodes trust when slow or flaky.

**Tier the suite by speed and blast radius:**

- **pre-commit / on-save** — static checks + fast unit tests; sub-second to a
  few seconds; runs constantly and must never block flow.
- **PR / CI (blocking)** — unit + the key integration tests. Hold it to an
  explicit **wall-clock budget**; it gates every merge, so its speed _is_ team
  velocity.
- **nightly / scheduled** — e2e, mutation, fuzz, DST soak runs, chaos
  experiments, full cross-matrix (OS / runtime versions); slow, broad, or
  long-running, and off the merge critical path.

**Move a test to nightly/scheduled** when it is too slow for the PR budget, is an
inherently long-running campaign (fuzz, DST soak, chaos), needs expensive or
rate-limited resources, is a full cross-matrix sweep, or its marginal
bug-catch-per-minute is low.

**Judge each test by value-per-time, and budget by criticality.** A test's worth
is the bugs it catches and the confidence it buys _relative to the wall-clock it
spends on every run_; a slow test that rarely fails meaningfully is a candidate
for nightly or deletion. Allocate the blocking-tier budget in proportion to the
**criticality of the system area each suite guards** — generously where failure
is catastrophic (money movement, auth, data integrity), sparingly on
low-risk/low-churn areas.

**Flakiness is the #1 velocity killer** — an intermittently failing test trains
the team to ignore red, which defeats the suite. Quarantine a flaky test out of
the blocking tier fast, then **fix-or-delete**; never paper over it with blind
retry-to-green. Track flake rate as a health metric.

**Keep the blocking tier fast as the suite grows** via parallelization /
sharding across workers and **test selection** (run only the tests a change
impacts). Mutation and fuzz parallelize naturally across workers and nightly
windows.

This is where the "right altitude" pyramid pays off: a top-heavy suite blows the
blocking-tier budget first.
```

- [ ] **Step 2: Update the formal-methods.md reference bullet**

Find this existing bullet at the bottom of the file:

```
- [`references/formal-methods.md`](references/formal-methods.md) — when formal
  methods earn their cost and which tool fits which problem.
```

Replace it with:

```
- [`references/formal-methods.md`](references/formal-methods.md) — when formal
  methods, simulation, and fault injection (DST, Jepsen, chaos engineering) earn
  their cost and which tool fits which problem.
```

- [ ] **Step 3: Normalize formatting**

Run: `deno fmt skills/testing-practices/SKILL.md`

- [ ] **Step 4: Verify**

Run: `deno task fmt-check && deno task lint-skills` Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/testing-practices/SKILL.md
git commit -m "feat(testing-practices): add suite-maintenance/velocity section + broaden formal-methods pointer"
```

---

### Task 5: references/formal-methods.md — broaden to simulation & fault injection

**Files:**

- Modify: `skills/testing-practices/references/formal-methods.md` (H1 + insert a
  section before `## Aligning a spec with the implementation`)

**Interfaces:**

- Consumes: the `Simulation / DST` and `Chaos / resilience` matrix-row labels
  (Task 1) and the references pointer text (Task 4).
- Produces: tool names (madsim, turmoil, `testing/synctest`, Antithesis, Jepsen,
  Bombadil, Chaos Mesh, …) referenced by the per-language docs in Task 6.

- [ ] **Step 1: Broaden the H1**

Replace:

```
# Formal methods & specifications
```

with:

```
# Formal methods, specifications & simulation
```

- [ ] **Step 2: Insert the fault-injection section before the "Aligning a spec"
      heading**

Find this existing heading:

```
## Aligning a spec with the implementation
```

Insert the following immediately **before** it (one blank line separating them):

```
## Fault injection: simulation, real clusters, and chaos

Many of the hardest bugs only surface under faults — partitions, crashes,
latency, clock skew, reordered or dropped messages. Three families inject those
faults. As you move down the list you trade **reproducibility for realism**, and
shift from proving _correctness_ to validating _resilience_. Pick by which you
need.

### Deterministic Simulation Testing (DST) — most reproducible

Run the whole system in one deterministic environment where time, network, disk,
scheduling, and randomness are all driven by a single seed, so
`seed + code version = exact replay`. Heisenbugs become reproducible failures,
and long operation compresses into minutes on one core. Lineage: FoundationDB
(`BUGGIFY`) → TigerBeetle's VOPR.

- **OSS, in-process** (you design the system around deterministic I/O):
  **madsim** and **turmoil** (Rust); Go's **`testing/synctest`** (stdlib, stable
  in 1.25); **shuttle** / **loom** for the concurrency-interleaving sub-case.
- **Hypervisor** (works on most software, proprietary): **Antithesis** runs the
  system in a deterministic hypervisor, autonomously explores state while
  injecting faults, and makes every bug reproducible. Its **SDK** (Go, Rust, C,
  C++, Java, Python, JS, .NET) exposes an assertion taxonomy — `always`,
  `sometimes` (a coverage-superior "this scenario was actually exercised"
  check), and `reachable` / `unreachable` — plus controlled randomness and fault
  injection. Exact symbols vary per SDK; check the per-language docs.

In-process and hypervisor DST are complementary (e.g. Turso runs both).

### Black-box on real clusters — Jepsen

**Jepsen** drives a _real_ distributed cluster under injected faults (its
`nemesis`) and checks the recorded history for consistency violations with the
**Knossos / Elle** checkers. It finds violations in the real system, but a
failure may not reproduce — the trade DST avoids. Use Jepsen to validate the
real system, DST to get deterministic repro.

### Chaos engineering — most realistic

Inject faults into staging or production to validate **resilience and
availability**, not correctness. The discipline: state a steady-state
hypothesis, bound the blast radius, and automate continuously. Tools: Chaos
Monkey / Simian Army, **Chaos Mesh** and **LitmusChaos** (CNCF, Kubernetes),
**AWS FIS**, **Gremlin**, and **Toxiproxy** (network-fault proxy).

### UI front-end — Bombadil

**Bombadil** (`antithesishq/bombadil`) is Antithesis's open-source
property-based testing framework for **web and terminal UIs** (TypeScript spec,
Rust implementation; successor to Quickstrom). It autonomously drives the UI and
checks declared properties after each action; it runs locally or in CI but gets
perfect seed-based replay only inside the Antithesis platform.

DST is the **runnable bridge** between property/model testing and full formal
verification: property-based testing is the gateway to thinking in invariants,
and DST exercises those invariants against a simulated, fault-injecting world.
```

- [ ] **Step 3: Verify the drift check still passes**

Run: `deno task check` Expected: PASS (generated files in sync; this file is not
a generator input).

- [ ] **Step 4: Commit**

```bash
git add skills/testing-practices/references/formal-methods.md
git commit -m "docs(testing-practices): cover DST, Jepsen, chaos, Antithesis & Bombadil in formal-methods"
```

---

### Task 6: Per-language reference docs — golden + DST/Antithesis rows

**Files:**

- Modify: `skills/testing-practices/references/rust.md`
- Modify: `skills/testing-practices/references/go.md`
- Modify: `skills/testing-practices/references/python.md`
- Modify: `skills/testing-practices/references/typescript.md`
- Modify: `skills/testing-practices/references/haskell.md`

**Interfaces:**

- Consumes: tool names from Task 5; the `Golden / snapshot` and
  `Simulation / DST` matrix labels from Task 1.
- Produces: nothing downstream.

- [ ] **Step 1: rust.md — add Golden and Simulation rows**

In the table, after the `| Mutation | cargo-mutants | … |` row, add:

```
| Golden / snapshot | insta | `assert_snapshot!`, redactions, `cargo insta review` |
| Simulation / DST | madsim / turmoil | deterministic async runtime / sim network; `shuttle`/`loom` for interleavings |
```

Then, after the existing `**Emphasis:**` paragraph, add this line:

```
**DST / hypervisor:** an Antithesis Rust SDK exists; see `formal-methods.md`.
```

- [ ] **Step 2: go.md — add Golden and Simulation rows**

In the table, after the `| Mutation | go-mutesting | … |` row, add:

```
| Golden / snapshot | goldie (or autogold) | golden files; `-update` to regenerate |
| Simulation / DST | testing/synctest | stdlib fake-clock bubble (stable in Go 1.25) |
```

Then, after the existing `**Property choice:**` paragraph, add this line:

```
**DST / hypervisor:** Go has an Antithesis SDK; see `formal-methods.md`.
```

- [ ] **Step 3: python.md — add Golden row + DST note**

In the table, after the `| Mutation | mutmut (or cosmic-ray) | … |` row, add:

```
| Golden / snapshot | syrupy | `assert x == snapshot` |
```

Then, after the existing `**Emphasis:**` paragraph, add this line:

```
**DST / hypervisor:** no mature in-process DST framework; a Python Antithesis SDK exists — see `formal-methods.md`.
```

- [ ] **Step 4: typescript.md — add Golden row + DST note**

In the table, after the `| Mutation | Stryker | … |` row, add:

```
| Golden / snapshot | vitest (or jest) snapshots | `toMatchSnapshot` / `toMatchInlineSnapshot` |
```

Then, after the existing `**Emphasis:**` paragraph, add this line:

```
**DST / hypervisor:** no mature in-process DST framework; a JS Antithesis SDK exists, and **Bombadil** drives web/terminal UIs — see `formal-methods.md`.
```

- [ ] **Step 5: haskell.md — add Golden row**

In the table, after the `| Mutation | mucheck | … |` row, add:

```
| Golden / snapshot | tasty-golden | `goldenVsString` / `goldenVsFile` |
```

(No Antithesis SDK for Haskell — do not add a DST note.)

- [ ] **Step 6: Verify the drift check still passes**

Run: `deno task check` Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add skills/testing-practices/references/rust.md skills/testing-practices/references/go.md skills/testing-practices/references/python.md skills/testing-practices/references/typescript.md skills/testing-practices/references/haskell.md
git commit -m "docs(testing-practices): add golden + DST/Antithesis rows to per-language refs"
```

---

### Task 7: Full verification & regeneration gate

**Files:**

- Modify (only if drift detected): generated harness outputs via
  `deno task generate`

**Interfaces:**

- Consumes: all prior tasks.
- Produces: a clean `deno task ci`.

- [ ] **Step 1: Run the full CI gate**

Run: `deno task ci` Expected: PASS (fmt-check, lint, typecheck, generated-file
drift check, validate-manifests, lint-skills, test).

- [ ] **Step 2: If the drift check fails, regenerate and inspect**

Run: `deno task generate && git status --short` Expected: either no changes, or
only regenerated harness outputs (never hand-edit them).

- [ ] **Step 3: Commit any regenerated outputs (only if Step 2 produced
      changes)**

```bash
git add -A
git commit -m "chore(testing-practices): regenerate harness outputs after skill update"
```

- [ ] **Step 4: Re-run CI to confirm green**

Run: `deno task ci` Expected: PASS.

---

## Self-Review

**Spec coverage** (against `2026-06-26-testing-practices-update-design.md`):

- Golden tests — matrix row (Task 1) + dedicated subsection (Task 2). ✓
- Oracle framing (specified/recorded/derived/invariant) incl. differential —
  Task 2. ✓
- Minimal-test ("Goldilocks") — Task 3. ✓
- E2E discipline — Task 3. ✓
- Suite maintenance & velocity (tiering, nightly, value-per-time/criticality,
  flakiness, parallelism) — Task 4. ✓
- Simulation/DST + Chaos matrix rows; ladder update — Task 1. ✓
- formal-methods.md: DST (madsim/turmoil/synctest/shuttle/loom/VOPR/Antithesis),
  Jepsen, chaos (Chaos Mesh/Litmus/AWS FIS/Gremlin/Toxiproxy), Bombadil —
  Task 5. ✓
- Per-language golden libs (insta/goldie/syrupy/vitest/tasty-golden) +
  DST/Antithesis notes — Task 6. ✓
- formal-methods.md filename kept, H1 broadened — Task 5. ✓
- No install commands; delegation lines preserved — Global Constraints + every
  task. ✓
- Marketplace drift/CI gate — Task 7. ✓

**Placeholder scan:** No TBD/TODO; every prose block is the literal final
content. ✓

**Type/label consistency:** Matrix labels `Golden / snapshot`,
`Simulation / DST`, `Chaos / resilience` used identically in Task 1 and Tasks
5–6; tool names (madsim, turmoil, `testing/synctest`, Antithesis, Bombadil,
Jepsen) spelled consistently across Tasks 5–6. ✓
