# navigable-codebases skill — design

**Date:** 2026-06-25 **Status:** Approved (brainstorming) **Marketplace:**
devkit

## Purpose

Add a `navigable-codebases` skill to the devkit marketplace — the
**developer-experience** counterpart to `writing-clean-code`. It is a
**portable** skill: an authoring discipline the agent applies to whatever repo
it is working in, so the next contributor — human, or an agent with a bounded
context window — can orient quickly.

It enforces one outcome: a repo is navigable when a newcomer can answer four
questions **without reading the whole tree** —

1. Where do I start?
2. How do I run things?
3. Where does code live?
4. Does first-run actually work?

The skill shapes that discoverability surface and keeps it **single-sourced** so
it cannot drift out of truth. It is an _authoring_ discipline (leave the repo
navigable), not a _consuming_ one (how to read an unfamiliar repo).

The name is deliberately distinct from the existing `developer-environment`
skill, which sits one letter from "developer-experience" and would invite
confusion for humans and agents scanning the skill list.

## Non-goals (YAGNI)

- A documentation-generator or template kit. The skill ships principles, not
  fill-in `README` / `AGENTS.md` / `ARCHITECTURE.md` templates that rot and
  impose one structure on every repo.
- Installing or configuring the task runner — always delegate to
  `developer-environment`. This skill _exposes and names_ workflows; it does not
  install the runner.
- Defining module boundaries or code structure — that is `writing-clean-code`.
  This skill _documents and maps_ boundaries; it does not decide where they
  fall.
- The consuming side (how an agent orients in an unfamiliar codebase). This
  skill is authoring-only.
- Per-language reference docs. The meaningful variation here is by **harness**
  (agent-instruction files), not by language.

## File layout

```
skills/navigable-codebases/
├── SKILL.md                          # the four pillars + anti-drift throughline (core)
└── references/
    ├── agent-instruction-files.md    # AGENTS.md / CLAUDE.md / GEMINI.md … conventions, cross-harness
    └── codebase-map.md               # what an architecture/repo-map should & shouldn't contain
```

Style: harness-agnostic throughout — actions ("run a shell command", "read a
file"), never harness-specific tool names — matching the existing skills.
References are organized by **concern**, not by language.

## SKILL.md content

Authored in house style — **principles with counter-pulls** (mirroring
`writing-clean-code`): each principle names the failure it prevents _and_ the
over-application it guards against, so neither humans nor agents apply it
mechanically.

### Core framing

A repo is navigable when the next contributor can answer the four questions
above without reading the whole tree. Optimize the discoverability surface for
that, and keep it single-sourced so it can't drift. The audience is explicitly
**both** humans and agents with bounded context windows — legibility and
locality serve both at once.

### Pillar 1 — One obvious front door

A README quickstart and the agent-instruction files (`AGENTS.md` / `CLAUDE.md` /
`GEMINI.md` …) form a single, predictable entry point for both audiences; the
agent maintains them as the repo evolves. **Counter-pull:** don't scatter
onboarding across a wiki of docs, and don't write fifty lines of onboarding for
a three-file repo — depth matches repo size. Agent-instruction files carry only
what is **non-obvious and non-derivable** from the code, and **point to tasks**
rather than restating them. → `references/agent-instruction-files.md`.

### Pillar 2 — Workflows as named tasks

Every workflow a contributor repeats — test, build, lint, run, regenerate — is
one named command defined in one place (the runner `developer-environment`
installs, e.g. mise). **Boundary:** this skill exposes and names the workflows;
it does not install the runner. **Counter-pull:** don't wrap trivial one-liners
in indirection or mint a task for something run twice a year; name what people
actually repeat.

### Pillar 3 — A codebase map that earns its keep

An `ARCHITECTURE.md` / repo-map tells a newcomer where things live and **why**
the boundaries fall where they do — pairing with `writing-clean-code`'s module
boundaries. **Counter-pull:** a map that restates the directory tree is noise;
map the non-obvious — boundaries, data flow, "why this is split" — and keep it
short enough to stay true. → `references/codebase-map.md`.

### Pillar 4 — Onboarding you can actually run

Clone-to-running is a short, explicit sequence the agent **verifies by running
it**, so first-run can't silently rot. **Counter-pull:** don't re-specify
environment steps the task runner / `developer-environment` already guarantee —
verify, don't duplicate.

### Cross-cutting throughline — single source of truth / anti-drift

The principle that makes every pillar survive a changing repo: the
discoverability surface **references** executable tasks and the code itself; it
never **duplicates** what will drift. README points to task names instead of
re-spelling commands; the map describes boundaries instead of mirroring the file
tree. This is what distinguishes the skill from "just write docs."

### Boundaries with sibling skills (stated inline)

- Tool / runner **installation** → `developer-environment`.
- Module **boundaries & code structure** → `writing-clean-code` (this skill
  documents and maps them).
- `navigable-codebases` is the navigation/discoverability layer _over_ those.

## Reference docs

### agent-instruction-files.md

Conventions for agent-instruction files across harnesses (`AGENTS.md`,
`CLAUDE.md`, `GEMINI.md`, and the rest of the landscape):

- **What belongs:** the non-obvious and non-derivable — conventions, gotchas,
  the canonical task names, where _not_ to look. Points to tasks; never restates
  what the runner already encodes.
- **What doesn't:** restated directory trees, command lists that duplicate the
  task runner, anything the code already makes obvious.
- **Cross-harness landscape:** the convergence on `AGENTS.md` and the
  per-harness files, and how to keep one canonical source rather than N drifting
  copies.
- Keep it short enough to stay true; treat it as load-bearing context, not a
  changelog.

### codebase-map.md

What an architecture / repo-map should and shouldn't contain:

- **Should:** module boundaries and the _why_, data/control flow across the main
  paths, where a newcomer starts reading, the non-obvious splits.
- **Shouldn't:** a mirror of the directory tree, exhaustive file-by-file
  description, anything that drifts the moment a file moves.
- A **lean skeleton** (headings only) and the rule for keeping it true: map
  decisions, not layout.

## Integration with the marketplace

- **Register** in `skills/using-devkit/SKILL.md` "Available skills" with a
  one-line description (the `registry` linter greps for `**navigable-codebases**`
  and fails the build otherwise).
- **`fmt` exclude:** add `skills/navigable-codebases/references` to `deno.json`'s
  `fmt.exclude` only if a reference doc is hand-formatted (e.g. an aligned
  table); otherwise let `deno fmt` own it. Decide per file during
  implementation.
- **Regenerate:** `deno task fmt` (fmt → generate) propagates the skill into all
  harness outputs (`.opencode`, `.pi`, hooks, plugin manifests). Harness
  discovery is runtime, but the primer list, README, and generated metadata
  still need updating.
- **README:** add a row to the skills capability table.

## Verification

- **Skill linter** (`deno task lint-skills`): frontmatter valid; SKILL.md
  `description` within the char cap; all `references/*.md` links resolve;
  `navigable-codebases` listed in `using-devkit`.
- **Manifest validation** (`deno task validate-manifests`): regenerated
  manifests across all harnesses stay schema-valid.
- **Full gate:** `mise run release` / `deno task ci` green (fmt-check, lint,
  typecheck, check, validate-manifests, lint-skills, test).
- **Manual smoke check:** after regenerating, the skill appears in a generated
  harness output and `using-devkit` lists it, so the agent discovers it.

No new unit tests — the skill is content; the repo's existing linter/generator
tests cover the machinery that consumes it.

## Success criteria

- An agent invoking `navigable-codebases` can, for any repo it is shaping,
  decide what the front door, named tasks, codebase map, and verifiable
  onboarding should be — without leaving SKILL.md for the core decisions.
- The agent keeps the discoverability surface single-sourced: docs point to task
  names and code, never duplicating what drifts.
- The agent maintains agent-instruction files with only non-obvious,
  non-derivable content, finding the conventions in one reference doc.
- The agent never emits tool-install commands (routes to
  `developer-environment`) and never redefines module boundaries (defers to
  `writing-clean-code`).
- The new skill passes the full release gate end-to-end.
