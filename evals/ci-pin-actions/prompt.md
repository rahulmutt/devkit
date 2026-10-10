---
max_turns: 6
runs: 3
tags: [trigger, ci-pipelines]
allowed_tools: [Read, Glob, Grep, Skill]
---

Our workflows use actions/checkout@v4 and friends. Lock those down properly.
