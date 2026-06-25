# developer-environment skill — build orchestration / Bazel — design

**Date:** 2026-06-25 **Status:** Approved (brainstorming) **Marketplace:**
devkit

## Purpose

Broaden the `developer-environment` skill from *"install & pin tools"* to *"set
up a project's developer environment,"* of which **build-system choice** is now
a part. Add focused guidance on **when Bazel is warranted** plus a **curated
migration pointer doc**.

The mise-first / devenv.nix-fallback tool-install content is the unchanged
**core** of the skill. Bazel is a build/test *orchestration* system — a
different category from a tool/version manager — so it is added as a distinct
concern, not folded into the install decision tree.

## Design decisions (from brainstorming)

1. **Framing:** a new "build orchestration" section in `SKILL.md`. The skill
   stays one coherent developer-environment story; tool-install remains the core.
2. **Posture:** native per-language build tooling is the default. Bazel is a
   deliberate, high-cost choice, adopted **only on triggers**.
3. **Triggers (all four):** polyglot monorepo; build scale / incrementality;
   remote cache / execution; hermeticity & reproducibility.
4. **Migration doc:** a **curated pointer + phased path** — we own the
   sequencing, depth lives in the canonical upstream docs we link to.
5. **Bazel install:** reinforce mise-first — install `bazelisk` via a mise
   backend, pinned; `.bazelversion` pins Bazel itself.

## Non-goals (YAGNI)

- A full self-contained Bazel migration tutorial. The doc points to upstream;
  it does not reproduce commands/`BUILD`-file examples that rot against
  upstream.
- Bazel vs Buck/Pants/Gradle comparison. The triggers decide native-vs-Bazel;
  picking among meta-build systems is out of scope.
- Overloading `references/decision-tree.md` (tool installation) with
  build-system logic — they are separate concerns and stay separate.
- Teaching Bazel rule authoring. The doc points to per-language rulesets.

## File layout

```
skills/developer-environment/
├── SKILL.md                         # + "Build orchestration" section; updated description
├── references/
│   ├── decision-tree.md             # unchanged (tool install)
│   ├── devenv.nix                   # unchanged
│   ├── mise.toml                    # unchanged
│   └── bazel-migration.md           # NEW — curated pointer + phased path
```

## SKILL.md changes

### Frontmatter `description`

Expand so the skill also triggers on build-system decisions, e.g. add a clause:
*"...or deciding whether to adopt a build system (Bazel)."* Must still lead with
the tool-install triggers so existing activation is preserved.

### New "Build orchestration" section

Placed after the tool-install content. Concise. Contents:

- **Default posture:** use each language's native build tooling (`cargo`,
  `go build`, `npm`/`pnpm`, `deno task`, Gradle, …). A meta-build system is a
  deliberate, high-cost choice — don't adopt one without a trigger.
- **When to reach for Bazel** — adopt only when one or more hold; each one line:
  1. **Polyglot monorepo** — multiple languages built/tested together where
     native tools don't compose across boundaries.
  2. **Build scale / incrementality** — codebase large enough that a
     fine-grained build graph materially cuts CI and local rebuild times.
  3. **Remote cache / execution** — shared remote caching and/or remote
     execution across a team or CI fleet.
  4. **Hermeticity & reproducibility** — strictly sandboxed, fully reproducible
     builds as a hard requirement (the build-time echo of the skill's pinning
     ethos).
- **Caution:** a single weak trigger rarely justifies the ongoing cost
  (`BUILD`-file upkeep, ruleset maintenance) — weigh it.
- **Install (mise-first):** install `bazelisk` via a mise backend, pinned; let
  `.bazelversion` pin Bazel. One command example.
- Pointer to `references/bazel-migration.md`.

## references/bazel-migration.md

A concise reference. We own the phase sequencing; each phase links the canonical
upstream doc rather than copying it.

Phases:

1. **Install** — `bazelisk` via mise (pinned) + `.bazelversion`. (ties back to
   mise-first)
2. **Module setup** — `bzlmod` / `MODULE.bazel` (modern); note `WORKSPACE` is
   legacy.
3. **Generate BUILD files** — Gazelle + per-language rulesets (`rules_go`,
   `rules_rust`, `rules_python`, `rules_js`, …).
4. **Wire remote cache / execution** — point to providers (`bazel-remote`,
   BuildBuddy, EngFlow).
5. **Cut over CI incrementally** — keep native builds running in parallel until
   parity, then switch.

Plus a short **"verify it works"** note (`bazel build //...`, `bazel test
//...`), mirroring the skill's existing "verify after installing" discipline.

## Integration / housekeeping

- Update the `developer-environment` row in `README.md` to mention
  build-orchestration / Bazel in one phrase.
- Run the repo's standard flow afterward: `deno fmt` → regenerate harness
  outputs → verify CI, since the frontmatter `description` change may be embedded
  in generated harness outputs.

## Success criteria

- Skill activates on both tool-install and build-system questions.
- A reader can decide native-vs-Bazel from the four triggers without leaving
  `SKILL.md`.
- The migration doc gives a phased path and a canonical link per phase; no
  reproduced upstream tutorial content.
- `deno fmt` clean and CI green after regeneration.
