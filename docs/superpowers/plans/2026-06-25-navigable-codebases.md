# navigable-codebases Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `navigable-codebases` skill to the devkit marketplace — an
authoring discipline that leaves a repo navigable for the next human or agent.

**Architecture:** A content skill: one `SKILL.md`
(principles-with-counter-pulls, house style) plus two concern-based reference
docs. Registered in the `using-devkit` primer and the README capability table,
then propagated to every harness output by the existing generator. No new
runtime code — the repo's linter, generator, and release gate are the test
harness.

**Tech Stack:** Markdown skill content; Deno task runner (`deno task …`) wrapped
by mise; the repo's `lint-skills`, `validate-manifests`, and `generate` scripts.

## Global Constraints

- **Harness-agnostic prose:** describe _actions_ ("run a shell command", "read a
  file"), never harness-specific tool names. (Matches every existing skill.)
- **House style:** `SKILL.md` is principles-with-counter-pulls — each principle
  names the failure it prevents _and_ the over-application it guards against
  (mirrors `writing-clean-code`).
- **Single-source-of-truth throughline:** the discoverability surface references
  executable tasks and the code; it never duplicates what drifts.
- **Delegation:** tool/runner install → `developer-environment`; module
  boundaries / code structure → `writing-clean-code`. Never emit install
  commands; never redefine boundaries.
- **Frontmatter:** `name` MUST equal the directory name `navigable-codebases`;
  `description` MUST be present, SHOULD start with `"Use when"`, and SHOULD be
  ≤500 chars (hard cap 1024).
- **Never hand-edit generated files** (`.claude-plugin/`, `.codex-plugin/`,
  `.cursor-plugin/`, `.kimi-plugin/`, `gemini-extension.json`, `GEMINI.md`,
  `hooks/`, `.pi/`, `.opencode/`). Change source + regenerate via
  `deno task fmt`.
- **Authoring-only scope:** the skill is about leaving a repo navigable, not
  about reading an unfamiliar one.

---

### Task 1: fmt-exclude + the agent-instruction-files reference

**Files:**

- Modify: `deno.json` (the `fmt.exclude` array)
- Create: `skills/navigable-codebases/references/agent-instruction-files.md`

**Interfaces:**

- Consumes: nothing (first task).
- Produces: `references/agent-instruction-files.md`, linked from `SKILL.md`
  (Task 3) and excluded from `deno fmt` so its hand-authored layout is
  preserved.

- [ ] **Step 1: Exclude the new references dir from `deno fmt`**

In `deno.json`, add the new path to the `fmt.exclude` array, immediately after
the `security-practices` entry, matching every sibling skill:

```json
"fmt": {
  "exclude": [
    "assets",
    ".impeccable",
    "skills/developer-environment/references",
    "skills/testing-practices/references",
    "skills/writing-clean-code/references",
    "skills/security-practices/references",
    "skills/navigable-codebases/references"
  ]
}
```

- [ ] **Step 2: Write the reference doc**

Create `skills/navigable-codebases/references/agent-instruction-files.md` with
exactly this content:

```markdown
# Agent-instruction files — what belongs, what drifts

Agent-instruction files (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and the rest)
are load-bearing context for coding agents — often the first thing a harness
reads. Treat them as the agent-facing half of the front door. Read this when
creating or maintaining one.

## What belongs

Only what is **non-obvious and non-derivable** from the code itself:

- The canonical **task names** for common workflows ("tests: `mise run test`"),
  pointing at the runner — never re-spelling the commands behind them.
- **Conventions** an agent can't infer: naming rules, the generated-vs-authored
  split, where _not_ to edit, commit and PR expectations.
- **Gotchas**: the footgun that wastes a session, the non-standard layout, the
  step that must run before another.
- A pointer to the **codebase map** for where things live.

## What doesn't

- Restated directory trees or file-by-file inventories — they drift the moment a
  file moves, and the agent can list the tree itself.
- Command lists that duplicate the task runner — point to the task name instead.
- Anything the code, types, or tests already make obvious.
- A changelog or history — this is context, not a journal.

The test for every line: _would the agent get this wrong, or waste effort,
without it?_ If not, cut it.

## The cross-harness landscape

Different harnesses look for different files — `AGENTS.md` is the converging
cross-tool convention, while `CLAUDE.md`, `GEMINI.md`, and others are
harness-specific. The failure mode is **N drifting copies** of the same
guidance.

Keep **one canonical source**:

- Prefer a single `AGENTS.md` and have harness-specific files _point to it_
  (e.g. a one-line `CLAUDE.md` that says "see AGENTS.md") where the harness
  allows.
- If a harness needs its own file, keep the shared content in one place and let
  the others reference it, rather than copy-pasting.
- When a convention changes, update the canonical source — one point means
  nothing to drift.

This is the single-source-of-truth throughline applied to the agent's front
door.

## Keep it true

An agent-instruction file is only useful while it's accurate; a stale one is
worse than none because it actively misleads. Keep it short enough that keeping
it true is cheap, and revisit it whenever the workflow it describes changes.
```

- [ ] **Step 3: Verify formatting is unaffected**

Run: `deno task fmt-check` Expected: PASS — the new reference is excluded, and
`deno.json` was edited by hand to valid JSON. (If `deno.json` itself is flagged,
run `deno fmt deno.json` and re-check.)

- [ ] **Step 4: Commit**

```bash
git add deno.json skills/navigable-codebases/references/agent-instruction-files.md
git commit -m "feat: navigable-codebases — agent-instruction-files reference + fmt-exclude"
```

---

### Task 2: the codebase-map reference

**Files:**

- Create: `skills/navigable-codebases/references/codebase-map.md`

**Interfaces:**

- Consumes: the `fmt.exclude` entry added in Task 1 (so this file's layout is
  preserved).
- Produces: `references/codebase-map.md`, linked from `SKILL.md` (Task 3).

- [ ] **Step 1: Write the reference doc**

Create `skills/navigable-codebases/references/codebase-map.md` with exactly this
content (note the inner skeleton is a fenced block):

````markdown
# The codebase map — decisions, not layout

A codebase map orients a newcomer before they read code: where to start, where
things live, and _why_ the boundaries fall where they do. It lives in
`ARCHITECTURE.md`, or a section of the README for a small repo. Read this when
writing or revising one.

## What it should contain

- **Where to start reading** — the entry point(s) and the main flow through the
  system.
- **The boundaries and the why** — the major modules / bounded contexts and the
  reason each is separate (pairs with `writing-clean-code`'s module boundaries).
- **Data and control flow** along the primary paths — how a request, build, or
  job moves through the parts.
- **The non-obvious splits** — anything whose placement would surprise a
  newcomer, plus the rationale.

## What it should not contain

- A mirror of the directory tree — it drifts the instant a file moves, and the
  reader can list it themselves.
- File-by-file or function-by-function description — that's the code's job.
- Anything that restates names already obvious from the structure.

Map **decisions, not layout.** If a line would change merely because a file was
renamed, it doesn't belong.

## A lean skeleton

```
# Architecture

## Start here
<entry points + the one-paragraph mental model>

## The pieces
<each major module: its one responsibility and why it's separate>

## How it flows
<the main path(s), end to end>

## Non-obvious decisions
<splits, constraints, or trade-offs a newcomer would question>
```

## Keep it true

Length is the enemy of accuracy: the longer the map, the faster it rots. Keep it
to the decisions that are expensive to re-derive, and update it when a boundary
moves — not when a file does. A short map that's true beats a thorough one
that's wrong.
````

- [ ] **Step 2: Verify formatting is unaffected**

Run: `deno task fmt-check` Expected: PASS — the references dir is excluded from
`deno fmt`.

- [ ] **Step 3: Commit**

```bash
git add skills/navigable-codebases/references/codebase-map.md
git commit -m "feat: navigable-codebases — codebase-map reference"
```

---

### Task 3: SKILL.md (RED — discovered but not yet registered)

**Files:**

- Create: `skills/navigable-codebases/SKILL.md`

**Interfaces:**

- Consumes: both reference docs from Tasks 1–2 (the two `references/…` links
  must resolve).
- Produces: a lint-discoverable skill whose ONLY remaining lint failure is the
  registry check (fixed in Task 4).

- [ ] **Step 1: Write SKILL.md**

Create `skills/navigable-codebases/SKILL.md` with exactly this content:

```markdown
---
name: navigable-codebases
description: Use when shaping a repo so the next contributor (human or an agent with a bounded context window) can orient fast — a discoverable front door (README + AGENTS.md/CLAUDE.md), common workflows exposed as named tasks, a codebase map that explains the boundaries, and onboarding you verify by running it. Keep the discoverability surface single-sourced so it can't drift. Delegates runner install to developer-environment and code structure to writing-clean-code.
---

# Navigable Codebases

A repo is navigable when the next contributor — a human, or an agent with a
bounded context window — can answer four questions **without reading the whole
tree**:

1. Where do I start?
2. How do I run things?
3. Where does code live?
4. Does first-run actually work?

While authoring, shape that discoverability surface and keep it
**single-sourced** so it can't drift. Legibility and locality serve humans and
agents at once. This is an _authoring_ discipline — leave the repo navigable —
not a recipe for reading someone else's.

## Principles — each with its counter-pull

Each principle names the failure it prevents _and_ the over-application it
guards against, so neither humans nor agents apply it mechanically.

### One obvious front door

A README quickstart and the agent-instruction files (`AGENTS.md`, `CLAUDE.md`,
`GEMINI.md`, …) are the single, predictable entry point for both audiences;
maintain them as the repo evolves. Counter-pull: don't scatter onboarding across
a wiki of docs, and don't write fifty lines of onboarding for a three-file repo
— depth matches repo size. Agent-instruction files carry only what is
non-obvious and non-derivable from the code, and point to tasks rather than
restating them. See
[`references/agent-instruction-files.md`](references/agent-instruction-files.md).

### Workflows as named tasks

Every workflow a contributor repeats — test, build, lint, run, regenerate — is
one named command defined in one place (the runner `developer-environment`
installs). This skill exposes and names the workflows; it never installs the
runner. Counter-pull: don't wrap a trivial one-liner in indirection or mint a
task for something run twice a year. Name what people actually repeat.

### A codebase map that earns its keep

A map (`ARCHITECTURE.md`, or a section of the README for a small repo) tells a
newcomer where things live and _why_ the boundaries fall where they do — pairing
with `writing-clean-code`'s module boundaries. Counter-pull: a map that restates
the directory tree is noise. Map the non-obvious — boundaries, data flow, "why
this is split" — and keep it short enough to stay true. See
[`references/codebase-map.md`](references/codebase-map.md).

### Onboarding you can actually run

Clone-to-running is a short, explicit sequence you verify by _running it_, so
first-run can't silently rot. Counter-pull: don't re-specify environment steps
the task runner or `developer-environment` already guarantee — verify, don't
duplicate.

## The throughline: single source of truth

What makes every principle survive a changing repo: the discoverability surface
**references** executable tasks and the code itself; it never **duplicates**
what will drift. The README points to task _names_ instead of re-spelling
commands; the map describes boundaries instead of mirroring the file tree. When
you catch yourself copying a command or a file list into prose, stop — link to
the source. This is what separates this skill from "just write docs."

## Boundaries with sibling skills

- Tool / runner **installation** → `developer-environment`.
- Module **boundaries and code structure** → `writing-clean-code` (this skill
  documents and maps them; it doesn't decide where they fall).

`navigable-codebases` is the navigation and discoverability layer _over_ those.

## References

- [`references/agent-instruction-files.md`](references/agent-instruction-files.md)
  — what belongs in `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` and the rest of the
  landscape, and how to keep one canonical source instead of N drifting copies.
- [`references/codebase-map.md`](references/codebase-map.md) — what a map should
  and shouldn't contain, a lean skeleton, and the rule for keeping it true.
```

- [ ] **Step 2: Normalize SKILL.md formatting**

`SKILL.md` files are NOT fmt-excluded (only `references/` dirs are). Format it:

Run: `deno fmt skills/navigable-codebases/SKILL.md` Expected: either "Checked N
files" with no change, or it reformats and reports the file. Either is fine.

- [ ] **Step 3: Run the skill linter — expect exactly one (registry) failure**

Run: `deno task lint-skills` Expected: FAIL, with a single error of the form:
`skill "navigable-codebases" not listed in using-devkit (expected **navigable-codebases**)`

This is the RED state — it proves the skill is discovered, the frontmatter is
valid, the description is within budget, and both reference links resolve. The
only missing piece is registration, fixed next. If any _other_ error appears
(frontmatter, budget, links), fix it before proceeding.

- [ ] **Step 4: Commit**

```bash
git add skills/navigable-codebases/SKILL.md
git commit -m "feat: navigable-codebases — SKILL.md (principles + throughline)"
```

---

### Task 4: Register in the primer + README (GREEN — lint passes)

**Files:**

- Modify: `skills/using-devkit/SKILL.md` (the `## Available skills` list)
- Modify: `README.md` (the skills capability table)

**Interfaces:**

- Consumes: the discoverable skill from Task 3.
- Produces: a registered skill — `deno task lint-skills` now passes (registry
  check satisfied).

- [ ] **Step 1: Add the primer entry**

In `skills/using-devkit/SKILL.md`, append this bullet to the end of the
`## Available skills` list (after the `security-practices` bullet). The literal
`**navigable-codebases**` is what the registry linter greps for:

```markdown
- **navigable-codebases** — how to leave a repo navigable for the next
  contributor (human or agent). Use when shaping a repo's discoverability
  surface: a README + agent-instruction front door, common workflows exposed as
  named tasks, a codebase map of the boundaries, and onboarding you verify by
  running. Keeps the surface single-sourced so it can't drift; delegates runner
  install to developer-environment and code structure to writing-clean-code.
```

- [ ] **Step 2: Add the README capability-table row**

In `README.md`, add this row to the `## What you get` table, immediately after
the `security-practices` row. (Exact column alignment doesn't matter —
`deno fmt` normalizes the table in Task 5.)

```markdown
| **navigable-codebases** | Your agent leaves the repo navigable for whoever
comes next — human or agent: a discoverable front door (README +
AGENTS.md/CLAUDE.md), common workflows exposed as named tasks, a codebase map
that explains the boundaries, and onboarding it verifies by running. Keeps the
discoverability surface single-sourced so it can't drift; delegates runner
install to developer-environment and code structure to writing-clean-code. |
```

- [ ] **Step 3: Run the skill linter — expect GREEN**

Run: `deno task lint-skills` Expected: PASS, no errors. (Registry check now
finds `**navigable-codebases**` in the primer body.)

- [ ] **Step 4: Commit**

```bash
git add skills/using-devkit/SKILL.md README.md
git commit -m "docs: register navigable-codebases in primer + README"
```

---

### Task 5: Regenerate harness outputs + full release gate

**Files:**

- Modify (generated): all harness outputs under `.claude-plugin/`,
  `.codex-plugin/`, `.cursor-plugin/`, `.kimi-plugin/`, `gemini-extension.json`,
  `GEMINI.md`, `hooks/`, `.pi/`, `.opencode/` (whatever the generator touches).

**Interfaces:**

- Consumes: the registered, lint-green skill from Tasks 1–4.
- Produces: a fully generated, gate-passing repo state.

- [ ] **Step 1: Regenerate from source**

Run: `deno task fmt` Expected: runs `deno fmt` (normalizes `README.md`,
`using-devkit/SKILL.md`, and `navigable-codebases/SKILL.md`; leaves
`references/` untouched) then `deno task generate` (propagates the new skill
into every harness output). Completes without error.

- [ ] **Step 2: Run the full release gate**

Run: `deno task ci` Expected: PASS end to end — `fmt-check`, `lint`,
`typecheck`, `check` (generated files in sync), `validate-manifests`,
`lint-skills`, `test` all green.

If `check` reports generated files out of sync, it means Step 1 didn't fully
run; re-run `deno task generate` and re-run `deno task ci`.

- [ ] **Step 3: Manual smoke check — skill is discoverable**

Confirm the skill reached a generated harness output and the primer lists it:

```bash
grep -rl "navigable-codebases" .opencode .pi hooks .claude-plugin 2>/dev/null
grep "navigable-codebases" skills/using-devkit/SKILL.md
```

Expected: at least one generated path matches, and the primer line prints.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: regenerate harness outputs for navigable-codebases"
```

---

## Notes for the implementer

- **No unit tests are added.** This skill is content; the repo's existing
  linter, generator-sync check, and manifest validation (all run by
  `deno task ci`) are the test harness. The RED/GREEN cycle lives in Tasks 3→4
  (lint-skills fails on the missing registry entry, then passes once
  registered).
- **Order matters for the lint gate:** references (Tasks 1–2) exist before
  `SKILL.md` (Task 3) so its links resolve; the primer registration (Task 4) is
  what flips lint-skills from RED to GREEN; regeneration (Task 5) is last so it
  captures the final source state.
- **If `mise` is preferred over raw `deno task`:** the equivalents are
  `mise run fmt`, `mise run release` (== `deno task ci`), `mise run generate`,
  `mise run lint-skills`. Either works.
