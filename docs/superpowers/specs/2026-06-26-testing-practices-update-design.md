# testing-practices skill update — design

**Date:** 2026-06-26 **Status:** Approved (brainstorming) **Marketplace:**
devkit **Updates:** [2026-06-24 testing-practices
design](2026-06-24-testing-practices-design.md)

## Purpose

Extend the existing `testing-practices` skill with three themes the original
design did not cover:

1. **Golden / snapshot testing** — as both a decision-matrix row and a dedicated
   technique subsection.
2. **The oracle problem** — a unifying frame for how a test decides pass/fail,
   pulling differential / metamorphic / golden / property testing under one
   roof.
3. **Fault-injection across the realism↔reproducibility spectrum** — Deterministic
   Simulation Testing (DST), Jepsen, and chaos engineering — with concrete
   pointers to Antithesis, Bombadil, madsim, turmoil, Go `synctest`, Jepsen, and
   the CNCF chaos tools.

Plus one cross-cutting authoring principle: **find the minimal test that
captures a behavior** ("Goldilocks").

The skill stays a *decision framework*. All install/tooling concerns remain
delegated to `developer-environment`; this skill names libraries and idioms and
never emits install commands.

## Non-goals (YAGNI)

- Tutorials for any DST, chaos, or snapshot tool — pointers only.
- Exhaustive tool catalogs — one or two recommended options per role/language.
- Hardcoding per-SDK Antithesis assertion symbols — they vary per language;
  point at the docs.
- New languages beyond the existing five.
- Re-litigating the TDD-neutral stance — unchanged.

## Key decisions (from brainstorming)

- **Golden tests:** both a matrix row **and** a dedicated subsection.
- **Oracle framing:** a unifying "Choosing a test oracle" section
  (specified / recorded / derived / invariant); differential/oracle testing
  lives here.
- **DST + Antithesis/Bombadil:** folded into the existing `formal-methods.md`
  (not a new file), with a matrix row that points there.
- **Chaos engineering:** its own decision-matrix row (`Chaos / resilience`).
- **Jepsen:** included in the fault-injection section, explicitly distinguished
  from DST (real cluster, not deterministically reproducible).
- **Minimal-test principle:** a named "Goldilocks" subsection under *Aligning
  tests with implementation*.
- **`formal-methods.md` filename:** kept (broaden the H1 only) to avoid breaking
  the SKILL pointer.
- **Ladder:** `simulation (DST)` inserted just before formal methods; golden
  stays **out** of the cheapest-layer ladder (it is an oracle technique, not a
  rung).

## Changes to `SKILL.md`

### 1. Ladder line

Insert `simulation (DST)` before formal methods:

```
static checks → unit → integration → property / model / fuzz / mutation → simulation (DST) → UI → formal methods
```

Golden/snapshot is deliberately **not** a rung — it is a choice of oracle that
can apply at unit / integration / UI altitude.

### 2. Decision matrix — three new rows

Append to the existing 8-row matrix (final: 11 rows):

| Type               | Catches                                            | Reach for it when                                                                       | Cost |
| ------------------ | -------------------------------------------------- | -------------------------------------------------------------------------------------- | ---- |
| Golden / snapshot  | Unintended changes to large structured output      | Stable, reviewable serialized output (codegen, CLI, AST/IR, API JSON, render trees)    | Low  |
| Simulation / DST   | Heisenbugs from timing, faults, interleavings       | Distributed/concurrent systems where reproducibility is the core problem (see `formal-methods.md`) | High |
| Chaos / resilience | Availability/resilience failures under real faults | Validating a live distributed system stays up and degrades gracefully                   | High |

### 3. New section — "Choosing a test oracle"

Name the *oracle problem* (how a test decides pass/fail) and organize strategies
by what you can know:

- **Specified** → assert the exact expected value (you know the answer).
- **Recorded** → golden/snapshot (answer is stable but tedious to hand-write).
- **Derived** → differential (vs a reference / previous implementation) or
  metamorphic (relations between outputs) — use when you can't state the answer
  but can compare against another oracle.
- **Invariant** → property-based (you know a rule, not the value).

This is where **differential / oracle testing** is covered, as a sibling of
golden and property testing.

### 4. New subsection — "Golden / snapshot tests"

The technique in depth (paired with the matrix row):

- **When it fits:** large, structured, serialization-stable output a human can
  meaningfully review — CLI/terminal output, rendered DOM/component trees,
  compiler/AST/IR, API JSON, generated code, formatter output. **Poor fit:**
  small scalars (assert them explicitly) or blobs no reviewer can judge.
- **Pitfalls:** over-broad / whole-page snapshots (brittle, unreviewable);
  churn from blindly running `--update` / `-u`; nondeterminism (redact
  timestamps / UUIDs / ANSI / random ordering); "write-only" snapshots nobody
  reads in review.
- **One-line relation to approval testing:** golden/snapshot is the
  more-automated variant of the approval-testing family — same
  compare-against-a-committed-reference mechanism, differing in how explicit the
  human approval gate is.
- Points readers to per-language libraries in `references/<language>.md`.

### 5. New subsection — "One behavior, minimally captured" (Goldilocks)

Under *Aligning tests with implementation*:

> For each behavior, find the **smallest** test that pins it — too simple passes
> without exercising the behavior; too broad is redundant, brittle, and churns;
> just right fails iff *this* behavior breaks. Favor narrow oracles and inline
> snapshots over whole-output dumps.

Tie-ins: one-behavior-per-test, narrow oracles, and the over-broad-snapshot
pitfall from §4.

### 6. References pointer

Update the `formal-methods.md` bullet to reflect its broadened scope (formal
methods, specifications **and simulation / fault injection**).

## Changes to `references/formal-methods.md`

Keep the filename. Broaden the H1 to **"Formal methods, specifications &
simulation."** Add a fault-injection section framed on the
**realism ↔ reproducibility** axis, and on *what* each validates
(correctness vs resilience):

> As you move DST → Jepsen → chaos engineering you trade reproducibility for
> realism, and shift from proving correctness to validating resilience. Pick by
> which you need.

Three tiers + the UI front-end:

1. **Deterministic Simulation Testing (DST)** — most reproducible, simulated
   environment, tests *correctness*. The whole system runs in one deterministic
   environment; time, network, disk, scheduling, and randomness are driven by a
   single seed, so `seed + code version = exact replay`, turning heisenbugs into
   reproducible failures. Lineage: FoundationDB (`BUGGIFY`) → TigerBeetle VOPR.
   - **OSS in-process** (design the system around deterministic I/O):
     **madsim** and **turmoil** (Rust), Go **`testing/synctest`** (stable in
     1.25), and **shuttle** / **loom** for the concurrency-interleaving
     sub-case. VOPR (Zig) is the canonical reference simulator.
   - **Hypervisor** (works on most software, proprietary): **Antithesis** — runs
     the whole system in a deterministic hypervisor, autonomously explores state
     while injecting faults, every bug perfectly reproducible. Its **SDK** (8
     languages: Go, Rust, C, C++, Java, Python, JS, .NET) exposes an assertion
     taxonomy — `always`, `sometimes` (a coverage-superior "this scenario was
     actually exercised" check), and `reachable`/`unreachable` — plus
     fault-injection and controlled randomness. **Caveat to encode:** exact
     symbols vary per SDK; point at the per-language docs rather than hardcoding.
   - In-process vs hypervisor are **complementary** (e.g. Turso runs both).
2. **Black-box fault injection on real clusters** — **Jepsen** (Kyle
   Kingsbury / aphyr): drives a *real* distributed cluster under injected faults
   (partitions, clock skew, process pauses) via its `nemesis`, then checks the
   recorded history for consistency violations with the **Knossos / Elle**
   checkers. **Distinction to draw:** Jepsen finds violations in the real system
   but a failure may not reproduce — DST trades realism for deterministic
   replay. Use Jepsen to validate the real system, DST to get repro.
3. **Chaos engineering** — least reproducible, most realistic
   (staging/production), tests *resilience / availability*, not correctness. The
   discipline: form a steady-state hypothesis, bound the blast radius, automate
   continuously (Principles of Chaos). Tools: **Chaos Monkey / Simian Army**,
   **Chaos Mesh** and **LitmusChaos** (CNCF, Kubernetes), **AWS FIS**,
   **Gremlin** (commercial), **Toxiproxy** (network-fault proxy).

Plus the UI front-end:

- **Bombadil** (`antithesishq/bombadil`) — Antithesis's open-source
  property-based testing framework for **web and terminal UIs** (TypeScript
  spec, Rust implementation; successor to Quickstrom). Autonomously drives the
  UI and checks declared properties after each action; runs locally or in CI,
  but gets perfect seed-based replay only inside the Antithesis platform.

Framing line to retain from the existing doc: property-based testing is the
gateway to thinking in invariants; **DST is the runnable bridge** between
property/model testing and full formal verification.

## Changes to per-language reference docs (all five)

Add rows only where a real option exists; keep the existing "install →
developer-environment" delegation line.

- **Golden / snapshot:**
  - Rust → **insta** (`assert_snapshot!`, redactions, `cargo insta review`).
  - TypeScript → **vitest** / **jest** snapshots (`toMatchSnapshot`,
    `toMatchInlineSnapshot`, `toMatchFileSnapshot`).
  - Python → **syrupy** (`assert x == snapshot`).
  - Go → **goldie** / **autogold** (golden files, `-update`).
  - Haskell → **tasty-golden** (`goldenVsString` / `goldenVsFile`).
- **Simulation / DST:**
  - Rust → **madsim** / **turmoil** (+ **shuttle** / **loom** for concurrency
    interleavings).
  - Go → **`testing/synctest`** (stdlib, stable in 1.25).
  - Python / TypeScript / Haskell → no mature OSS DST framework; note
    **Antithesis SDK** availability instead (Python, JS have SDKs).

Where a language has an Antithesis SDK, add a one-line pointer to the DST tier in
`formal-methods.md` rather than duplicating the taxonomy.

## Marketplace integration

- No new files (DST/chaos fold into `formal-methods.md`); the `using-devkit`
  listing and skill discovery need no change.
- Run the marketplace drift/consistency guards and `deno fmt` after edits;
  never hand-format generated outputs. Verify CI from within the working tree.

## Success criteria

- An agent can, from `SKILL.md` alone, decide when to reach for golden tests,
  DST, or chaos engineering, and pick a test oracle deliberately.
- The minimal-test ("Goldilocks") principle is stated as a named, actionable
  rule.
- `formal-methods.md` lets an agent distinguish DST vs Jepsen vs chaos
  engineering and name the right tool per language, without emitting install
  commands.
- Each per-language reference names a concrete golden/snapshot library and (where
  one exists) a DST option.
- The update passes the marketplace's existing drift/consistency checks.
