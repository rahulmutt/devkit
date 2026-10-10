---
max_turns: 8
runs: 3
tags: [behavior, ci-pipelines]
allowed_tools: [Skill]
---

This GitHub-hosted repo has no CI yet. Its `mise.toml`:

    [tools]
    deno = "2.9.7"

    [tasks.release]
    description = "Release gate: fmt-check, lint, test"
    run = "deno task ci"

`deno.json` defines `"ci": "deno fmt --check && deno lint && deno test -A"`.

Add CI for this repo. Reply with the complete contents of every file you would
create or change. Don't ask questions; make reasonable choices.
