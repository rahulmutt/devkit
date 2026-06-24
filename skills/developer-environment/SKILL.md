---
name: developer-environment
description: Use when installing a tool, pinning a language version, adding a dependency, or setting up a project's dev environment. Enforces mise-first, devenv.nix-fallback with pinned versions.
---

# Developer Environment

Install developer tools with **mise**, pinned to exact versions. Fall back to
**devenv.nix** only when mise cannot provide the tool.

## The rule

1. **mise is the default** for languages, CLIs, and runtimes. One declarative
   `mise.toml`, fast, per-project.
2. **devenv.nix is the fallback** — only for what mise cannot supply (system
   libraries, niche packages, anything needing the Nix ecosystem).

## Always pin

The default command is:

```bash
mise use --pin <tool>@<version>
```

`--pin` writes the fully-resolved exact version into `mise.toml`
(e.g. `node = "22.11.0"`, not a fuzzy `node = "22"`), so checkouts are
deterministic across machines and CI. **Never use bare `mise use`** — an
unpinned entry is a reproducibility bug.

## Decision flow

1. **Is the tool in the mise registry?** (`mise registry | grep <tool>`)
   → `mise use --pin <tool>@<version>`, commit `mise.toml`.
2. **Not in the registry, but available on a mise backend** (asdf, aqua, ubi,
   cargo, npm, pipx, go)?
   → install via that backend, still pinned, e.g.
   `mise use --pin "cargo:ripgrep@14.1.1"`.
3. **Genuinely unavailable through mise** (system lib, complex Nix derivation)?
   → add it to `devenv.nix` (see `references/devenv.nix`).

See `references/decision-tree.md` for worked examples.

## Verify after installing

Never claim a tool is installed without checking. After install:

```bash
mise install
<tool> --version   # confirm it resolves to the pinned version
```

If the version printed does not match the pin, the install is not done.

## Coexistence

mise and devenv.nix can live in one repo: mise for the common case, devenv.nix
for the exceptions. Keep each tool in exactly one place — don't pin the same
tool in both.

## Templates

Copy and adapt:
- `references/mise.toml` — pinned `[tools]`, `[env]`, `[tasks]`.
- `references/devenv.nix` — minimal fallback shell.
