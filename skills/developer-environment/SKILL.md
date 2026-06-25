---
name: developer-environment
description: Use when installing a tool, pinning a language version, adding a dependency, setting up a project's dev environment, or deciding whether to adopt a build system (Bazel). Enforces mise-first, devenv.nix-fallback with pinned versions; native build tooling by default.
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

`--pin` writes the fully-resolved exact version into `mise.toml` (e.g.
`node = "22.11.0"`, not a fuzzy `node = "22"`), so checkouts are deterministic
across machines and CI. **Never use bare `mise use`** — an unpinned entry is a
reproducibility bug.

## Decision flow

1. **Is the tool in the mise registry?** (`mise registry | grep <tool>`) →
   `mise use --pin <tool>@<version>`, commit `mise.toml`.
2. **Not in the registry, but available on a mise backend** (asdf, aqua, ubi,
   cargo, npm, pipx, go)? → install via that backend, still pinned, e.g.
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

## Build orchestration

Tool installation is one half of the environment; how the project _builds and
tests_ is the other. **Default to each language's native build tooling** —
`cargo`, `go build`, `npm`/`pnpm`, `deno task`, Gradle. A meta-build system is a
deliberate, high-cost choice; don't adopt one without a trigger.

### When to reach for Bazel

Adopt Bazel only when one or more of these hold:

1. **Polyglot monorepo** — multiple languages built and tested together, where
   native per-language tools don't compose across the boundaries.
2. **Build scale / incrementality** — the codebase is large enough that a
   fine-grained build graph materially cuts CI and local rebuild times.
3. **Remote cache / execution** — you need shared remote caching and/or remote
   execution across a team or CI fleet.
4. **Hermeticity & reproducibility** — strictly sandboxed, fully reproducible
   builds are a hard requirement (the build-time echo of pinning).

A single weak trigger rarely justifies the ongoing cost — `BUILD`-file upkeep
and ruleset maintenance are permanent. Weigh it before committing.

Install Bazel the same mise-first way as any tool: pin `bazelisk` (the
version-managing launcher) and let `.bazelversion` pin Bazel itself.

```bash
mise use --pin bazelisk@<version>   # then: echo "<bazel-version>" > .bazelversion
```

When a trigger holds and you're migrating, follow the phased path in
`references/bazel-migration.md`.

## Templates

Copy and adapt:

- `references/mise.toml` — pinned `[tools]`, `[env]`, `[tasks]`.
- `references/devenv.nix` — minimal fallback shell.
