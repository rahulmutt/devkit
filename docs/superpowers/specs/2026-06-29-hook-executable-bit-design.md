# Fix: `run-hook.cmd` missing executable bit on Unix

**Date:** 2026-06-29 **Status:** Approved (design)

## Problem

When devkit starts in Claude Code on Linux/macOS, the SessionStart hook fails:

```
SessionStart:clear hook error
Failed with non-blocking status code: /bin/sh: 1: .../hooks/run-hook.cmd: Permission denied
```

The error is non-blocking (the session still starts), but it surfaces a scary
error on every session start and the session-start hook never runs.

## Root cause

`hooks/run-hook.cmd` is a **polyglot** wrapper: the same file is a valid Windows
`.cmd` batch script (top block, fenced as a shell heredoc) and a valid POSIX
shell script (bottom block). All three hook configs invoke it _directly_:

```json
"command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start"
```

The design intends each OS to select its own interpreter — Windows runs it under
`cmd.exe`, Unix under `/bin/sh`. But invoking a file directly on Unix requires
the **execute permission bit**. The file does not have it, so `/bin/sh` reports
`Permission denied`.

Three places reinforce the same gap:

1. `hooks/run-hook.cmd` and `scripts/templates/hooks/run-hook.cmd` are tracked
   in git as mode `100644` — so a marketplace checkout has no execute bit.
2. The generator writes generated files via `Deno.writeTextFile`
   (`scripts/lib/files.ts` → `writeFiles`), which creates mode `0644` and never
   sets `+x`. So `deno task generate` would re-break the file even if it were
   chmod'd manually.
3. `checkFiles` (same file) compares only _content_, not mode — so
   `generate --check` / CI cannot catch the drift.

Only `run-hook.cmd` is affected. The `session-start` / `session-start-codex`
scripts are run via `exec bash "$SCRIPT"` from inside the wrapper, so they are
passed to an explicit interpreter and do not need the execute bit.

## Design

A coordinated fix so the bug is both fixed and stays fixed.

### 1. Set the executable bit in git

Mark both copies of the wrapper executable (mode `100755`):

- `hooks/run-hook.cmd`
- `scripts/templates/hooks/run-hook.cmd`

Done with `git update-index --chmod=+x <file>` (plus the on-disk `chmod`). This
is the change that actually fixes distribution, because the marketplace installs
the plugin by checking out the repo, and git preserves the `100755` mode. The
execute bit is a no-op on Windows/NTFS, so this is safe cross-platform.

### 2. Generator preserves the bit

So regeneration does not silently reintroduce the bug:

- Extend `GeneratedFile` (`scripts/lib/types.ts`) with an optional
  `executable?: boolean`.
- In `render-templated.ts`, mark the `run-hook.cmd` entry `executable: true`.
- In `writeFiles` (`scripts/lib/files.ts`), after writing, `Deno.chmod` the file
  to `0o755` when `f.executable` is set (otherwise leave default).

### 3. `checkFiles` becomes mode-aware

So `generate --check` / CI fails if the bit is ever lost again:

- In `checkFiles`, when `f.executable` is set, also `Deno.stat` the file and
  treat a missing execute bit as `drift` (same status already used for content
  mismatch — no new status value needed).

## Alternatives considered (rejected)

- **Invoke via `sh "…/run-hook.cmd"`** in the hook configs — breaks the polyglot
  design on Windows, where the file must be interpreted by `cmd.exe`.
- **One-time manual `chmod +x`** — fixes the symptom but the generator
  reintroduces it on the next run. Not durable.

## Testing

- Unit: extend `scripts/lib/files_test.ts` to assert `writeFiles` produces an
  executable file when `executable: true`, and that `checkFiles` reports `drift`
  when the bit is removed.
- Generator: `render-templated` marks `run-hook.cmd` executable.
- Manual: `deno task generate` leaves `hooks/run-hook.cmd` as mode `755`;
  `git ls-files -s hooks/run-hook.cmd` shows `100755`.

## Out of scope

- The `session-start` scripts (run via explicit `bash`, no bit needed).
- Any change to the polyglot wrapper's contents or the hook command strings.
