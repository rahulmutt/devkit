# Devkit

A multi-harness marketplace of developer-workflow skills for AI coding agents
(Claude Code, Codex, Cursor, Gemini, Kimi, pi, opencode).

Ships the **developer-environment** skill: install tools with **mise** (pinned),
fall back to **devenv.nix** only when mise can't provide the tool.

## Install

**Claude Code:** add this marketplace, then install the `devkit` plugin.

**Codex / Cursor / Kimi:** install the plugin from this repo; skills are
discovered from `skills/` and a session-start hook injects the `using-devkit`
primer.

**Gemini:** add the extension; `GEMINI.md` loads the primer.

**opencode:** see `.opencode/INSTALL.md`.

## How it works

All per-harness manifests and bootstrap injectors are **generated** from one
source of truth, `marketplace.config.ts`. Never hand-edit generated files.

```bash
mise install                 # get deno + node, pinned
deno task generate           # render all manifests + bootstraps
deno task check              # verify everything is in sync (CI / pre-commit)
deno task test               # run the generator test suite
```

### Adding or changing metadata

Edit `marketplace.config.ts`, then `deno task generate`. Bumping the version =
change `plugin.version` in that one file and regenerate.

### Adding a skill

Add `skills/<name>/SKILL.md` (frontmatter `name` + `description`), list it in
`skills/using-devkit/SKILL.md`, and regenerate.

## Repo layout

- `marketplace.config.ts` — source of truth
- `scripts/` — Deno generator (`generate.ts`, `lib/`, `templates/`)
- `skills/` — harness-agnostic skill content
- generated: `.claude-plugin/`, `.codex-plugin/`, `.cursor-plugin/`,
  `.kimi-plugin/`, `gemini-extension.json`, `GEMINI.md`, `hooks/`, `.pi/`,
  `.opencode/`
