# Tool installation decision tree

```
Need a tool?
│
├─ In the mise registry?  (`mise registry | grep <tool>`)
│     └─ YES → mise use --pin <tool>@<version>
│
├─ On a mise backend? (asdf/aqua/ubi/cargo/npm/pipx/go)
│     └─ YES → mise use --pin "<backend>:<tool>@<version>"
│
└─ Not available via mise (system lib / complex Nix)?
      └─ add it to devenv.nix `packages`
```

## Commands

- Check the registry: `mise registry` (or `mise registry | grep <tool>`).
- Install a pinned tool: `mise use --pin <tool>@<version>`.
- Apply the config: `mise install`.
- Verify: `<tool> --version`.

## Worked examples

### 1. A language, via mise (registry)

```bash
mise use --pin node@22      # writes node = "22.11.0" to mise.toml
mise install
node --version              # v22.11.0
```

### 2. A CLI, via a mise backend

`ripgrep` is available through the cargo backend:

```bash
mise use --pin "cargo:ripgrep@14.1.1"
mise install
rg --version               # ripgrep 14.1.1
```

### 3. A system library, via devenv.nix (mise can't supply it)

`libpq` (PostgreSQL client headers) is a system library — add it to `devenv.nix`:

```nix
{ pkgs, ... }:
{
  packages = [ pkgs.libpq ];
}
```

```bash
devenv shell
pg_config --version        # confirm it resolves
```
