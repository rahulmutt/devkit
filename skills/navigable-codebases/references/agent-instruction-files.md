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
