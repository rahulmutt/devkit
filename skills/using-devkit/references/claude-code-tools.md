# Claude Code tool mapping

- Invoke a skill → the `Skill` tool.
- Read a file → `Read`. Create/edit a file → `Write`/`Edit`. Run a shell command → `Bash`.
- Search file contents → `Grep`. Find files by name → `Glob`.
- Create a todo / track work → `TodoWrite`.
- Dispatch a subagent → the `Task` tool with a `subagent_type`.
