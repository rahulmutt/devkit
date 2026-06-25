# Devkit

Give your AI coding agent real engineering discipline. Devkit is a set of
workflow **skills** your agent consults automatically as it works — so it
installs tools the pinned, reproducible way, picks the right kind of test before
writing one, and structures code that stays maintainable.

Works across **Claude Code, Codex, Cursor, Gemini, Kimi, pi, and opencode**.
Install once; the agent does the rest.

## What you get

| Skill                     | What it does for you                                                                                                                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **developer-environment** | Your agent installs tools and pins language versions with **mise** (reproducible), falling back to **devenv.nix** only when mise can't provide a tool — instead of scattering ad-hoc global installs.                         |
| **testing-practices**     | Before writing tests, the agent decides _which_ kind of validation fits — static checks, unit, integration, property/model/fuzz/mutation, UI, or formal methods — and aligns it with the code.                                |
| **writing-clean-code**    | The agent designs abstractions, draws module boundaries, applies domain-driven design / hexagonal architecture, and follows each language's canonical style — optimizing for code humans _and_ agents can maintain long-term. |
| **using-devkit**          | The primer that ties it together: tells the agent these skills exist and to check them before acting.                                                                                                                         |

## Install

Pick your harness. After installing, verify by asking your agent: **"Tell me
about your devkit skills."**

### Claude Code

```text
/plugin marketplace add rahulmutt/devkit
/plugin install devkit@devkit-marketplace
```

### opencode

Add devkit to the `plugin` array in your `opencode.json`, then restart opencode:

```json
{ "plugin": ["devkit@git+https://github.com/rahulmutt/devkit.git"] }
```

### Gemini CLI

Add the extension from this repo (`rahulmutt/devkit`). `GEMINI.md` loads the
primer automatically at session start.

### Codex / Cursor / Kimi / pi

Install the plugin from this repo (`rahulmutt/devkit`). Skills are discovered
from `skills/`, and a session-start hook injects the `using-devkit` primer so
the agent knows the skills are available.

## How you use it

You don't invoke these skills by hand. Once installed, the `using-devkit` primer
makes the agent aware of them, and each skill activates on its own when your
work matches it:

- Ask it to **add a dependency or pin a version** → it follows
  _developer-environment_ (mise-first, pinned).
- Ask **"how should I test this?"** → it reasons through _testing-practices_
  before reaching for a test framework.
- Ask it to **build or refactor a feature** → it applies _writing-clean-code_,
  including the per-language style guide and hexagonal-architecture reference.

The skills are harness-agnostic — they describe _actions_ ("read a file", "run a
shell command"), and each harness translates those to its own tools. Nothing to
configure per project.

## Development

The per-harness manifests, hooks, and bootstrap injectors are **generated** from
a single source of truth, `marketplace.config.ts`. **Never hand-edit generated
files** — change the config (or a template) and regenerate.

Tasks run through **mise** (which delegates to `deno task` so the commands live
in one place, `deno.json`):

```bash
mise install        # get deno + node, pinned from mise.toml
mise run generate   # render all manifests + bootstraps from marketplace.config.ts
mise run release    # full gate: fmt-check, lint, typecheck, generated-files in sync, tests
```

`mise run release` is the release gate — it also runs in **pre-commit** and in
**GitHub Actions CI**, so a change can't merge with stale generated files or a
failing check. Individual steps are also available: `mise run fmt`, `fmt-check`,
`lint`, `typecheck`, `check`, `validate-manifests`, `lint-skills`, `test`.

**Change metadata** (name, version, description): edit `marketplace.config.ts`,
then `mise run generate`.

**Add a skill:** create `skills/<name>/SKILL.md` (frontmatter `name` +
`description`), list it under `## Available skills` in
`skills/using-devkit/SKILL.md`, then `mise run generate`.

### Repo layout

- `marketplace.config.ts` — source of truth
- `scripts/` — Deno generator (`generate.ts`, `lib/`, `templates/`)
- `skills/` — harness-agnostic skill content
- generated: `.claude-plugin/`, `.codex-plugin/`, `.cursor-plugin/`,
  `.kimi-plugin/`, `gemini-extension.json`, `GEMINI.md`, `hooks/`, `.pi/`,
  `.opencode/`

## License

MIT — see [LICENSE](LICENSE).
