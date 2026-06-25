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
