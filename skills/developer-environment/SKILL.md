---
name: developer-environment
description: Use when installing a tool, pinning a language version, adding or updating a dependency (tool, runtime, or application library), setting up a project's dev environment, or deciding whether to adopt a build system (Bazel). Enforces mise-first, devenv.nix-fallback with pinned versions; native build tooling by default.
---

# Developer Environment

Install developer tools with **mise**, pinned to exact versions. Fall back to
**devenv.nix** only when mise cannot provide the tool.

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
   → add it to `devenv.nix` (see
   [`references/devenv.nix`](references/devenv.nix)).

See [`references/decision-tree.md`](references/decision-tree.md) for worked
examples.

## Verify after installing

Never claim a tool is installed without checking. After install:

```bash
mise install
<tool> --version   # confirm the pinned version (use the binary's real name, e.g. rg for ripgrep)
```

If the version printed does not match the pin, the install is not done.

## Coexistence

mise and devenv.nix can live in one repo: mise for the common case, devenv.nix
for the exceptions. Keep each tool in exactly one place — don't pin the same
tool in both.

## Application dependencies

mise and devenv.nix provision the **toolchain**; a project's **application and
library dependencies** are owned by the language's native package manager —
`npm`/`pnpm`, `cargo`, `go mod`, `uv`/`pip`, `cabal`. mise installs the package
manager (pinned); the package manager resolves the libraries.

1. **Commit the lockfile.** A committed lockfile is the application-dependency
   echo of pinning — it makes resolution deterministic across machines and CI.
   Pin to exact versions, or to the tightest range your lockfile fully resolves;
   never depend on a floating latest.
2. **Every dependency is a liability.** Each one is code you don't control but
   must read, update, and trust — `writing-clean-code`'s "every line is a
   liability" carried into the supply chain. Prefer the standard library or one
   small, well-maintained dependency over several overlapping ones, and weigh
   the transitive cost before adding.
3. **Update on a cadence, not in a panic.** Keep dependencies current with an
   automated updater (Renovate, Dependabot) gated by CI, so upgrades land in
   small reviewable steps instead of a risky big-bang bump.

Scanning those dependencies for known CVEs is `security-practices`' supply-chain
control (SCA), not this skill's job.

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
[`references/bazel-migration.md`](references/bazel-migration.md).

## Templates

Copy and adapt:

- [`references/mise.toml`](references/mise.toml) — pinned `[tools]`, `[env]`,
  `[tasks]`.
- [`references/devenv.nix`](references/devenv.nix) — minimal fallback shell.
