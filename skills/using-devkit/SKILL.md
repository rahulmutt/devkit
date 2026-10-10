---
name: using-devkit
description: Use when starting any conversation or new engineering task in a repo with devkit installed — establishes that devkit skills exist and must be checked before acting.
---

# Using Devkit

You have devkit skills. Devkit is a small marketplace of developer-workflow
skills that work across AI coding agents.

**Before acting on a task, check whether a devkit skill applies.** If one does,
invoke it and follow it. Even a small chance a skill applies means you should
check.

## Available skills

Each entry says when to load that skill. Load every one that matches — a single
task often needs several (a new webhook endpoint → security-practices and
testing-practices).

<!-- BEGIN GENERATED: skill index -->

- **developer-environment** — Use when installing or upgrading any tool,
  runtime, CLI, or library — brew, apt, npm i -g, pip install, cargo install,
  nvm, pyenv, asdf — editing mise.toml or .tool-versions, bumping or pinning
  versions, adding a dependency, hitting "command not found", setting up a dev
  or CI toolchain, reviewing Renovate or Dependabot version bumps, or
  considering Bazel.
- **navigable-codebases** — Use when writing or updating a README, AGENTS.md,
  CLAUDE.md, GEMINI.md, ARCHITECTURE.md, or onboarding docs; when setting up a
  new repository; when adding or naming task-runner commands (mise tasks,
  Makefile, justfile, npm scripts); or when getting-started steps are missing,
  stale, or slow for newcomers.
- **security-practices** — Use when code touches a trust boundary — HTTP
  endpoints, webhooks, file uploads, auth, sessions, permissions, SQL or shell
  built from input, deserialization, service-to-service calls — when handling
  secrets, API keys, or .env files, on a CVE or vulnerability alert, when
  writing a threat model, or when choosing secret, SCA, SAST, or container
  scanners.
- **testing-practices** — Use when writing, adding, or reviewing tests; choosing
  between unit, integration, snapshot/golden, property, fuzz, mutation, e2e/UI,
  or formal methods; when a test is flaky or the suite or CI is slow; or when
  deciding what runs in pre-commit, PR CI, or nightly.
- **writing-clean-code** — Use when refactoring or restructuring code, splitting
  a file or module that has grown too large, deciding whether to extract a
  helper or inline it, naming things, removing dead or unused code, drawing
  module or package boundaries, handling errors, writing comments, applying DDD
  or hexagonal (ports and adapters) architecture, or checking a language's
  idiomatic style.

<!-- END GENERATED: skill index -->

Devkit skills are domain guidance, not workflows. When a process skill
(planning, brainstorming, TDD, debugging) also applies, follow it as the
workflow and load the matching devkit skills for the decisions inside it.

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
