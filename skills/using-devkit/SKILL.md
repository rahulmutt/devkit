---
name: using-devkit
description: Use when starting any conversation in a repo with devkit installed — establishes that devkit skills exist and must be checked before acting.
---

# Using Devkit

You have devkit skills. Devkit is a small marketplace of developer-workflow
skills that work across AI coding agents.

## The Rule

**Before acting on a task, check whether a devkit skill applies.** If one does,
invoke it and follow it. Even a small chance a skill applies means you should
check.

## Available skills

- **developer-environment** — how to install tools and set up a dev environment.
  Use whenever you install a tool, pin a language version, add a dependency, or
  set up a project's environment. The rule it enforces: install with **mise**
  (pinned), fall back to **devenv.nix** only when mise can't provide the tool.
- **testing-practices** — how to decide what to test and how. Use when choosing
  a form of validation (static checks, unit, integration, property/model/fuzz/
  mutation, UI, or formal methods), deciding when to reach for each, and
  aligning it with the implementation. Tool installation delegates to
  developer-environment.
- **writing-clean-code** — how to author and structure code so humans and coding
  agents can both maintain it long-term. Use when designing abstractions,
  deciding what to inline vs. extract, drawing module boundaries, applying DDD
  or hexagonal architecture, or following a language's canonical style. The
  authoring counterpart to **testing-practices**; tool installation delegates to
  developer-environment.
- **security-practices** — how to think about security and which free OSS
  scanners to use. Use when designing, changing, or reviewing a distributed
  component, handling untrusted input or secrets, or choosing security tooling.
  Applies a trust-boundary threat lens and selects scanners (secret, dependency/
  SCA, SAST, container/IaC) for the repo's stack; tool installation delegates to
  developer-environment.
- **navigable-codebases** — how to leave a repo navigable for the next
  contributor (human or agent). Use when shaping a repo's discoverability
  surface: a README + agent-instruction front door, common workflows exposed as
  named tasks, a codebase map of the boundaries, and onboarding you verify by
  running. Keeps the surface single-sourced so it can't drift; delegates runner
  install to developer-environment and code structure to writing-clean-code.

## How to invoke a skill

Skills speak in _actions_ ("read a file", "run a shell command"), not in any one
harness's tool names. Use your harness's native skill mechanism to load a skill,
and translate actions to your harness's tools using the matching reference in
`references/`:

- Claude Code → `references/claude-code-tools.md`
- Codex → `references/codex-tools.md`
- Cursor → `references/cursor-tools.md`
- Gemini → `references/gemini-tools.md`
- Kimi → `references/kimi-tools.md`
- pi → `references/pi-tools.md`
- opencode → `references/opencode-tools.md`
