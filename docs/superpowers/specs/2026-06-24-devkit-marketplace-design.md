# Devkit Marketplace & developer-environment Skill — Design

**Date:** 2026-06-24
**Owner:** Rahul Muttineni <rahulmutt@gmail.com>
**Status:** Approved design, ready for implementation planning

## Summary

Build a multi-harness AI-agent skills marketplace (`devkit-marketplace`, plugin
`devkit`) modeled on [obra/superpowers](https://github.com/obra/superpowers).
The marketplace ships shared, harness-agnostic skill content plus thin
per-harness manifests and bootstrap injectors for **Claude Code, Codex, Cursor,
Gemini, Kimi, pi, and opencode**.

All per-harness configs are **generated from a single source of truth** by a
Deno script (sandboxed via explicit permissions), with a `--check` drift mode
for CI/pre-commit. The flagship skill, `developer-environment`, encodes one
policy: **install tools with mise (pinned); fall back to devenv.nix only when
mise cannot provide the tool.**

## Goals

- A working marketplace installable into all 7 harnesses, mirroring the proven
  superpowers integration shape.
- Zero hand-maintenance of per-harness manifests: edit one config, regenerate.
- A guidance-plus-templates `developer-environment` skill teaching the
  mise-first / devenv.nix-fallback workflow.
- Automated guarantee that all manifests agree (drift check + tests).

## Non-Goals (YAGNI)

- Vendoring superpowers' TDD/debugging/planning skills. Devkit ships its own
  content.
- An external-repo sync script (superpowers' `sync-to-codex-plugin.sh` pushes to
  OpenAI's marketplace repo). Noted as a possible future addition.
- First-class Antigravity/Copilot manifests. The shared bash hook already emits
  the Copilot-compatible context shape opportunistically; dedicated manifests
  are deferred.

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Harnesses | All 7: claude, codex, cursor, gemini, kimi, pi, opencode |
| Config sync model | Generate all manifests from one source of truth |
| `developer-environment` skill scope | Guidance + reference templates |
| Bootstrap | Full superpowers-style session-start injection, per harness |
| Marketplace / plugin names | `devkit-marketplace` / `devkit` |
| Owner | Rahul Muttineni <rahulmutt@gmail.com> |
| Generator runtime | Deno (sandboxed: `--allow-read=. --allow-write=.`) |
| mise default command | `mise use --pin` (exact pinned versions) |
| GitHub repo | `rahulmutt/devkit` |
| Icon | Hand-authored original SVG (`assets/devkit.svg`) + rasterized `app-icon.png`; no image model used |
| `mise.toml` template | The repo's own toolchain (deno + node); doubles as the repo's real root `mise.toml` |

## Architecture

The repo is a **single source of truth → generated artifacts** system. You edit
`marketplace.config.ts` and the templates; everything else is generated and
drift-checked.

```
/workspace
├── marketplace.config.ts        # SINGLE SOURCE OF TRUTH (typed)
├── skills/                       # harness-agnostic skill content (shared verbatim)
│   ├── using-devkit/             # bootstrap/entry skill ("skills exist, use them")
│   │   ├── SKILL.md
│   │   └── references/           # per-harness tool mappings
│   │       ├── claude-code-tools.md
│   │       ├── codex-tools.md
│   │       ├── cursor-tools.md
│   │       ├── gemini-tools.md
│   │       ├── kimi-tools.md
│   │       ├── pi-tools.md
│   │       └── opencode-tools.md
│   └── developer-environment/    # the flagship skill
│       ├── SKILL.md
│       └── references/
│           ├── mise.toml         # starter template (pinned versions)
│           ├── devenv.nix        # starter template (fallback path)
│           └── decision-tree.md  # mise-first / devenv-fallback flow
├── scripts/
│   ├── generate.ts               # Deno generator: renders all manifests + bootstrap
│   ├── templates/                # per-harness output templates
│   └── lib/                      # config loader, renderers, drift-check
├── hooks/                        # GENERATED bash session-start variants + run-hook.cmd
├── assets/                       # devkit.svg (hand-authored) + app-icon.png (rasterized)
├── docs/superpowers/specs/       # this spec
├── package.json                  # metadata + version (generated/synced)
├── README.md
├── .pre-commit-config.yaml       # runs generate.ts --check
└── GENERATED (never hand-edited):
    ├── .claude-plugin/marketplace.json
    ├── .claude-plugin/plugin.json
    ├── .codex-plugin/plugin.json
    ├── .cursor-plugin/plugin.json
    ├── .kimi-plugin/plugin.json
    ├── .pi/extensions/devkit.ts
    ├── .opencode/plugins/devkit.js
    ├── .opencode/INSTALL.md
    ├── gemini-extension.json
    └── GEMINI.md
```

**Core invariant (from superpowers' porting doc):** skill bodies name *actions*
("install a tool", "read a file", "run a shell command"), never
harness-specific tool names. Per-harness tool mappings live in
`using-devkit/references/<harness>-tools.md` and are injected by the bootstrap.
This is what lets one `skills/` directory serve all 7 harnesses unedited.

## Component 1 — Source-of-truth config & generator

### `marketplace.config.ts`

A single typed object describes the plugin once:

```typescript
export const config: MarketplaceConfig = {
  marketplace: { name: "devkit-marketplace", description: "..." },
  plugin: {
    name: "devkit",
    version: "0.1.0",                 // the ONE place version lives
    description: "...",
    homepage: "https://github.com/rahulmutt/devkit",
    repository: "https://github.com/rahulmutt/devkit",
    license: "MIT",
    keywords: ["mise", "devenv", "developer-environment", "skills"],
  },
  owner:  { name: "Rahul Muttineni", email: "rahulmutt@gmail.com" },
  bootstrapSkill: "using-devkit",     // skill injected at session start
  harnesses: ["claude","codex","cursor","gemini","kimi","pi","opencode"],
  interface: {
    displayName: "Devkit",
    category: "Coding",
    brandColor: "#...",            // set alongside the icon
    logo: "./assets/app-icon.png",
    composerIcon: "./assets/devkit.svg",
  },
};
```

### `scripts/generate.ts` (Deno)

```
deno run --allow-read=. --allow-write=. scripts/generate.ts          # write all artifacts
deno run --allow-read=.                 scripts/generate.ts --check  # drift check, exit 1 on drift
```

- **Default mode:** load config, render every manifest + bootstrap file from
  `scripts/templates/`, write them with a `GENERATED by scripts/generate.ts —
  edit marketplace.config.ts instead` header comment.
- **`--check` mode:** render into memory, diff against committed files, print
  drift, exit non-zero. Needs no write permission, so CI runs it read-only.

This **replaces** superpowers' `bump-version.sh` + `.version-bump.json`: there
is no version to sync across files because the version lives in exactly one
place and flows outward. Bumping a version = edit one field, run the generator.

**Why Deno:** least-privilege sandbox (read config/templates, write outputs — no
net/env/arbitrary FS); runs typed TypeScript with no build step; and `deno` is
in the mise registry, so the generator's own runtime is provisioned by the very
skill the repo ships (`mise use --pin deno`). Deno is a dev-time dependency
only — never needed to *use* the marketplace.

### Templates

- JSON manifests: rendered from the config object.
- Text/code bootstraps (`hooks/session-start` bash, `.pi/extensions/devkit.ts`,
  `.opencode/plugins/devkit.js`, `GEMINI.md`): text templates with `{{name}}`,
  `{{version}}`, `{{bootstrapSkill}}`, owner, etc. substituted.

## Component 2 — Bootstrap mechanism (per harness)

The bootstrap is the entire integration: at session start, the full
`using-devkit/SKILL.md` (which teaches "skills exist; check before acting") plus
that harness's tool mapping is injected into the model's context.

| Harness | Generated artifacts | Injection mechanism |
|---|---|---|
| Claude Code | `.claude-plugin/{marketplace,plugin}.json`, `hooks/hooks.json`, `hooks/session-start` | SessionStart hook → `hookSpecificOutput.additionalContext` |
| Cursor | `.cursor-plugin/plugin.json`, `hooks/hooks-cursor.json` | Same bash script → `additional_context` (detected via `CURSOR_PLUGIN_ROOT`) |
| Codex | `.codex-plugin/plugin.json`, `hooks/hooks-codex.json`, `hooks/session-start-codex` | SessionStart hook (matcher `startup\|resume\|clear`) |
| Gemini | `gemini-extension.json`, `GEMINI.md` | `GEMINI.md` `@`-imports `using-devkit/SKILL.md` + `gemini-tools.md` |
| Kimi | `.kimi-plugin/plugin.json` | `sessionStart.skill: "using-devkit"` + inline `skillInstructions` |
| pi | `.pi/extensions/devkit.ts` | TS extension injects bootstrap on `session_start`/`session_compact` |
| opencode | `.opencode/plugins/devkit.js`, `.opencode/INSTALL.md` | JS plugin registers skills path + injects bootstrap into first user message |

- **Shared bash `hooks/session-start`** (Claude/Cursor/Codex/Copilot) auto-detects
  the platform via env vars (`CLAUDE_PLUGIN_ROOT`, `CURSOR_PLUGIN_ROOT`,
  `COPILOT_CLI`) and emits the JSON shape that platform expects. Lifted from the
  proven superpowers script (including the bash-5.3 `printf`-not-heredoc
  workaround).
- **`hooks/run-hook.cmd`** is the cross-platform polyglot wrapper: finds Git-Bash
  on Windows, is a no-op shim on Unix.
- **`using-devkit/SKILL.md`** is a short entry skill scoped to devkit: "this
  marketplace provides skills; before acting, check whether one applies; here is
  how to invoke them on your harness," pointing at the tool-mapping references.
  Modeled on `using-superpowers`, NOT a copy of its TDD/debugging machinery.

## Component 3 — The `developer-environment` skill

A **flexible guidance skill** (adapt to context) encoding one policy: **mise
first; devenv.nix only when mise cannot provide the tool.**

### `SKILL.md`

Frontmatter description triggers on "install a tool / set up dev environment /
add a dependency / pin a language version." Body covers:

1. **The rule & why.** mise is the default for languages, CLIs, and runtimes:
   one tool, declarative `mise.toml`, fast, per-project. devenv.nix is the
   fallback for what mise cannot supply (system libraries, niche packages,
   anything needing the Nix ecosystem).
2. **Default command is `mise use --pin <tool>@<version>`.** `--pin` writes the
   fully-resolved exact version into `mise.toml` (e.g. `node = "22.11.0"`, not a
   fuzzy `node = "22"`) so checkouts are deterministic across machines and CI.
   The skill explicitly warns against bare `mise use` — always `--pin`.
3. **Decision flow** (mirrors `decision-tree.md`):
   - Tool in the mise registry? → `mise use --pin <tool>@<version>`, commit `mise.toml`.
   - Not in the registry but on a mise backend (asdf/aqua/ubi/cargo/npm/pipx/go)?
     → use that backend via mise (still pinned).
   - Genuinely unavailable through mise (system lib, complex Nix derivation)? →
     add it to `devenv.nix`.
4. **Verify after install** (the step agents skip): run the tool's `--version`
   (or equivalent) and confirm it resolves to the pinned version. Never claim
   "installed" without it.
5. **Coexistence.** mise + devenv.nix in one repo: mise for the common case,
   devenv.nix for exceptions; keep each tool in exactly one place.

### `references/` templates (copied and adapted by the agent)

- **`mise.toml`** — annotated starter: `[tools]` with **pinned exact versions**,
  `[env]`, a couple of `[tasks]`. Mirrors the repo's own root `mise.toml`
  (deno + node), so the teaching template and the repo's real config stay in
  step:

  ```toml
  [tools]
  deno = "2.1.4"     # pinned via `mise use --pin deno`
  node = "22.11.0"   # pinned via `mise use --pin node@22`

  [tasks.generate]
  run = "deno run --allow-read=. --allow-write=. scripts/generate.ts"
  [tasks.check]
  run = "deno run --allow-read=. scripts/generate.ts --check"
  ```
- **`devenv.nix`** — minimal annotated starter (`packages`, `languages`,
  `enterShell`) with a comment marking it as the *fallback* path.
- **`decision-tree.md`** — the "is it in mise?" → action flowchart, the exact
  check commands (`mise registry`, `mise use --pin`, ...), and worked examples:
  a language via mise, a CLI via a mise backend, a system lib via devenv.nix.

## Verification strategy

- `deno run --allow-read=. scripts/generate.ts --check` is the consistency gate,
  wired into `.pre-commit-config.yaml`.
- `deno test`: loads the config, runs renderers in-memory, and asserts every
  harness manifest carries the same `name`/`version`/`description`, every
  `skills` path resolves, and bootstrap files reference the configured
  `bootstrapSkill`. Automated "all manifests agree" guard.
- Manual smoke test: install into Claude Code locally, start a session, confirm
  `using-devkit` is injected and `developer-environment` triggers on an install
  request.

## README

Covers: what devkit is; per-harness install instructions (lifted from the
proven superpowers phrasings); how to add a skill; and the rule "never
hand-edit generated files — edit `marketplace.config.ts` and run the generator."

## Icon

A **hand-authored, original SVG** (`assets/devkit.svg`) — no image model is used.
A clean vector mark (e.g. a stylized toolbox / wrench-and-cube in the brand
color) that is crisp at any size and version-controllable. `assets/app-icon.png`
is rasterized from the SVG (documented build step). The codex/kimi `interface`
blocks reference both. The `brandColor` hex is finalized alongside the icon
during implementation.

## Resolved during brainstorming

- **GitHub repo:** `rahulmutt/devkit` (homepage + repository URLs).
- **Icon:** hand-authored SVG + rasterized PNG (above); no image model available
  in-session, so this is the chosen, achievable path.
- **`mise.toml` template:** the repo's own toolchain (deno + node), doubling as
  the repo's real root `mise.toml`.
