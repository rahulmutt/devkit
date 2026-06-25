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
