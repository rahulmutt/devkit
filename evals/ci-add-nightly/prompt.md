---
max_turns: 8
runs: 3
tags: [behavior, ci-pipelines]
allowed_tools: [Skill]
---

This GitHub-hosted repo's `.github/workflows/ci.yml`:

    name: CI
    on:
      push: { branches: [main] }
      pull_request:
    jobs:
      release-gate:
        runs-on: ubuntu-24.04
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
          - uses: jdx/mise-action@2d8d4cafcbd33be2ea37d2b6f5ad595363d1f1ca # v5.1.1
          - run: mise run release

`mise.toml` has `[tasks.fuzz] run = "deno task fuzz"`, and `deno task fuzz`
accepts `--duration <seconds>`.

Add a nightly job that runs the fuzzer for an hour. Reply with the complete
contents of every file you would create or change. Don't ask questions.
