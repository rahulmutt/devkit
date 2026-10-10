---
max_turns: 8
runs: 3
tags: [behavior, ci-pipelines]
allowed_tools: [Skill]
---

Our tests pass locally, but in GitHub Actions `mise run release` fails with
`TypeError: Intl.Segmenter is not a constructor` in one test. Our ci.yml runs on
`ubuntu-latest`, uses `actions/setup-node@v4` with `node-version: 22`, and then
runs `mise run release`. Locally everyone uses mise, which pins
`node = "26.11.1"`. What should we do?
