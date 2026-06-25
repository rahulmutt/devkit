# developer-environment Bazel / Build-Orchestration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Broaden the `developer-environment` skill to cover build-system choice
— add a "Build orchestration" section that says when to adopt Bazel, plus a
curated migration pointer doc — without disturbing the mise-first tool-install
core.

**Architecture:** Three tracked artifacts change: a new
`skills/developer-environment/references/bazel-migration.md` (curated pointer +
phased path), the `skills/developer-environment/SKILL.md` (new section +
expanded frontmatter `description`), and the `README.md` skill-table row.
Validation is the repo's existing toolchain — `deno task lint-skills` for skill
rules and `deno task ci` for the full gate.

**Tech Stack:** Markdown skills; Deno tooling (`deno task fmt`, `deno task ci`,
`deno task lint-skills`); mise for tool pinning (`bazelisk` is in the mise
registry as `aqua:bazelbuild/bazelisk`).

## Global Constraints

- Skill frontmatter `description` MUST start with `Use when` and be ≤ 500 chars
  (linter: warn > 500, error > 1024).
- Every `references/<file>` mentioned in `SKILL.md` must exist; every file in
  `references/` must be mentioned in `SKILL.md` (else a warn). Missing target =
  error.
- `skills/developer-environment/references/` is **fmt-excluded** (deno fmt never
  rewrites it) — author reference docs by hand.
- `SKILL.md` and `README.md` ARE formatted by `deno fmt`; don't hand-align the
  README table — let `deno task fmt` re-pad it.
- The migration doc is a **curated pointer + phased path**: own the sequencing,
  link upstream for depth — do NOT reproduce a full Bazel tutorial.
- Posture is fixed: native build tooling by default; Bazel only on a trigger.
- Never claim done without running the stated command and seeing its output (the
  skill's own "verify, don't assume" rule).

---

### Task 1: Migration pointer doc

**Files:**

- Create: `skills/developer-environment/references/bazel-migration.md`
- Verify-with: `deno task lint-skills`

**Interfaces:**

- Consumes: nothing.
- Produces: the file `references/bazel-migration.md`, which Task 2's `SKILL.md`
  section links to via the literal path `references/bazel-migration.md`.

- [ ] **Step 1: Write the migration pointer doc**

Create `skills/developer-environment/references/bazel-migration.md` with exactly
this content:

````markdown
# Migrating to Bazel — a phased pointer

Reach for Bazel only when a trigger in `SKILL.md` holds. This is the migration
path; depth lives in the upstream docs each phase links. Migrate incrementally —
keep the existing native build green until Bazel reaches parity.

## Phase 0 — Install (mise-first)

Install `bazelisk` (the version-managing launcher), pinned, via mise; let
`.bazelversion` pin the Bazel release it launches.

```bash
mise use --pin bazelisk@<version>   # registry: aqua:bazelbuild/bazelisk
echo "<bazel-version>" > .bazelversion
```

Commit `mise.toml` and `.bazelversion` so every checkout resolves the same
Bazel. This is the same pinning rule as the rest of the skill.

## Phase 1 — Module setup (bzlmod)

Declare the workspace and external dependencies with **bzlmod**
(`MODULE.bazel`), the modern dependency system. `WORKSPACE` is legacy — don't
start there.

- bzlmod: https://bazel.build/external/module
- Migrating off WORKSPACE: https://bazel.build/external/migration

## Phase 2 — Generate BUILD files (Gazelle)

Generate and maintain `BUILD.bazel` targets with **Gazelle** plus the ruleset
for each language, instead of writing them by hand.

- Gazelle: https://github.com/bazelbuild/bazel-gazelle
- Rulesets: rules_go, rules_rust, rules_python, rules_js
  (https://github.com/bazelbuild)
- Find more: https://registry.bazel.build

## Phase 3 — Remote cache / execution

Wire a remote cache (and optionally remote execution) so the build graph is
shared across the team and CI.

- Remote caching: https://bazel.build/remote/caching
- Backends: bazel-remote (self-host), BuildBuddy, EngFlow

## Phase 4 — Cut over CI

Run Bazel alongside the native build in CI until output and test parity hold,
then make Bazel the source of truth and retire the native path.

## Verify

```bash
bazel build //...
bazel test //...
```

Both green across the targets you migrated means the phase is done — the same
"verify, don't assume" discipline as tool installs.
````

- [ ] **Step 2: Verify the file exists and lints clean (no errors)**

Run: `deno task lint-skills` Expected: exits 0 (`✓` no errors). It MAY print one
warn for `developer-environment`:
`references/bazel-migration.md exists but is never mentioned` — that is expected
here and is resolved in Task 2. Confirm there are **no `error` lines**.

- [ ] **Step 3: Commit**

```bash
git add skills/developer-environment/references/bazel-migration.md
git commit -m "feat(developer-environment): Bazel migration pointer doc"
```

---

### Task 2: SKILL.md — build-orchestration section + description

**Files:**

- Modify: `skills/developer-environment/SKILL.md` (frontmatter `description`;
  add a new section before `## Templates`)
- Verify-with: `deno task fmt-check`, `deno task lint-skills`

**Interfaces:**

- Consumes: `references/bazel-migration.md` from Task 1 (linked by literal
  path).
- Produces: a `## Build orchestration` section and an expanded `description`. No
  code symbols.

- [ ] **Step 1: Expand the frontmatter description**

In `skills/developer-environment/SKILL.md`, replace this line:

```yaml
description: Use when installing a tool, pinning a language version, adding a dependency, or setting up a project's dev environment. Enforces mise-first, devenv.nix-fallback with pinned versions.
```

with:

```yaml
description: Use when installing a tool, pinning a language version, adding a dependency, setting up a project's dev environment, or deciding whether to adopt a build system (Bazel). Enforces mise-first, devenv.nix-fallback with pinned versions; native build tooling by default.
```

(Starts with `Use when`; length is ~270 chars, under the 500 target.)

- [ ] **Step 2: Add the Build orchestration section**

In the same file, insert this section **immediately before** the final
`## Templates` heading:

````markdown
## Build orchestration

Tool installation is one half of the environment; how the project _builds and
tests_ is the other. **Default to each language's native build tooling** —
`cargo`, `go build`, `npm`/`pnpm`, `deno task`, Gradle. A meta-build system is a
deliberate, high-cost choice; don't adopt one without a trigger.

### When to reach for Bazel

Adopt Bazel only when one or more of these hold:

1. **Polyglot monorepo** — multiple languages built and tested together, where
   native per-language tools don't compose across the boundaries.
2. **Build scale / incrementality** — the codebase is large enough that a
   fine-grained build graph materially cuts CI and local rebuild times.
3. **Remote cache / execution** — you need shared remote caching and/or remote
   execution across a team or CI fleet.
4. **Hermeticity & reproducibility** — strictly sandboxed, fully reproducible
   builds are a hard requirement (the build-time echo of pinning).

A single weak trigger rarely justifies the ongoing cost — `BUILD`-file upkeep
and ruleset maintenance are permanent. Weigh it before committing.

Install Bazel the same mise-first way as any tool: pin `bazelisk` (the
version-managing launcher) and let `.bazelversion` pin Bazel itself.

```bash
mise use --pin bazelisk@<version>   # then: echo "<bazel-version>" > .bazelversion
```

When a trigger holds and you're migrating, follow the phased path in
`references/bazel-migration.md`.
````

- [ ] **Step 3: Format, then verify formatting is clean**

Run: `deno fmt skills/developer-environment/SKILL.md && deno task fmt-check`
Expected: `deno fmt` reports the file checked (rewriting only if needed);
`deno task fmt-check` exits 0 with no files listed.

- [ ] **Step 4: Verify skill rules pass with zero warnings**

Run: `deno task lint-skills` Expected: exits 0 and prints `✓ all checks passed`.
The Task 1 "exists but never mentioned" warn is now gone because `SKILL.md`
references `references/bazel-migration.md`, and no description-budget error
appears.

- [ ] **Step 5: Commit**

```bash
git add skills/developer-environment/SKILL.md
git commit -m "feat(developer-environment): build-orchestration section + Bazel triggers"
```

---

### Task 3: README row, regenerate, full gate

**Files:**

- Modify: `README.md:15` (the `developer-environment` table row)
- Verify-with: `deno task fmt`, `deno task ci`

**Interfaces:**

- Consumes: the completed SKILL.md and migration doc.
- Produces: an updated README row; confirmed-in-sync generated outputs; green
  CI.

- [ ] **Step 1: Update the developer-environment README row**

In `README.md`, replace the cell text of the `developer-environment` row
(line 15) — currently:

```
Your agent installs tools and pins language versions with **mise** (reproducible), falling back to **devenv.nix** only when mise can't provide a tool — instead of scattering ad-hoc global installs.
```

with:

```
Your agent installs tools and pins language versions with **mise** (reproducible), falling back to **devenv.nix** only when mise can't provide a tool — and uses native build tooling by default, reaching for **Bazel** only when a real trigger (polyglot monorepo, scale, remote cache, hermeticity) demands it.
```

Do not hand-align the surrounding `|` padding — the next step re-pads the table.

- [ ] **Step 2: Format and regenerate harness outputs**

Run: `deno task fmt` Expected: `deno fmt` re-aligns the README table and formats
touched files; `deno task generate` then runs and reports no out-of-sync writes
(skill descriptions are scanned at runtime, so generated manifests should be
unchanged). Inspect with `git status` — if any generated file changed, that is
intentional and will be committed in Step 4.

- [ ] **Step 3: Run the full CI gate**

Run: `deno task ci` Expected: exits 0. All sub-checks pass — `fmt-check`,
`lint`, `typecheck`, `check` (no generated-file drift), `validate-manifests`,
`lint-skills` (`✓ all checks passed`), and `test`.

- [ ] **Step 4: Commit**

```bash
git add README.md
git add -A   # include any regenerated outputs surfaced in Step 2
git commit -m "docs(developer-environment): note build-orchestration/Bazel in README"
```

---

## Self-Review

**Spec coverage** (checked against
`docs/superpowers/specs/2026-06-25-developer-environment-bazel-design.md`):

- New "Build orchestration" section in SKILL.md → Task 2, Step 2. ✓
- Frontmatter `description` expanded to trigger on build-system questions → Task
  2, Step 1. ✓
- Default-don't posture + four triggers (polyglot, scale, remote cache,
  hermeticity) → Task 2, Step 2. ✓
- Single-weak-trigger caution → Task 2, Step 2. ✓
- mise-first `bazelisk` install + `.bazelversion` → Task 2, Step 2 and Task 1
  (Phase 0). ✓
- `references/bazel-migration.md` curated pointer + 5-phase path + verify note →
  Task 1, Step 1. ✓
- `decision-tree.md` left untouched → no task modifies it. ✓
- README row update → Task 3, Step 1. ✓
- fmt → regenerate → CI housekeeping → Task 3, Steps 2–3. ✓

**Placeholder scan:** The only `<...>` tokens (`<version>`, `<bazel-version>`)
are intentional user-supplied values inside example commands the agent writes
verbatim into docs — not plan placeholders. No TBD/TODO/"handle edge cases". ✓

**Type consistency:** No code symbols introduced. The cross-task contract is the
single literal reference path `references/bazel-migration.md`, used identically
in Task 1 (created) and Task 2 (linked). ✓
