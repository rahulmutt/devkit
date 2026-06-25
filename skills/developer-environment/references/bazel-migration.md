# Migrating to Bazel — a phased pointer

Reach for Bazel only when a trigger in `SKILL.md` holds. This is the migration
path; depth lives in the upstream docs each phase links. Migrate incrementally —
keep the existing native build green until Bazel reaches parity.

## Phase 0 — Install (mise-first)

Install `bazelisk` (the version-managing launcher), pinned, via mise; let
`.bazelversion` pin the Bazel release it launches.

```bash
mise use --pin bazelisk@<version>   # registry: aqua:bazelbuild/bazelisk
echo "<bazel-version>" > .bazelversion
```

Commit `mise.toml` and `.bazelversion` so every checkout resolves the same
Bazel. This is the same pinning rule as the rest of the skill.

## Phase 1 — Module setup (bzlmod)

Declare the workspace and external dependencies with **bzlmod**
(`MODULE.bazel`), the modern dependency system. `WORKSPACE` is legacy — don't
start there.

- bzlmod: https://bazel.build/external/module
- Migrating off WORKSPACE: https://bazel.build/external/migration

## Phase 2 — Generate BUILD files (Gazelle)

Generate and maintain `BUILD.bazel` targets with **Gazelle** plus the ruleset
for each language, instead of writing them by hand.

- Gazelle: https://github.com/bazelbuild/bazel-gazelle
- Rulesets: rules_go, rules_rust, rules_python, rules_js (https://github.com/bazelbuild)
- Find more: https://registry.bazel.build

## Phase 3 — Remote cache / execution

Wire a remote cache (and optionally remote execution) so the build graph is
shared across the team and CI.

- Remote caching: https://bazel.build/remote/caching
- Backends: bazel-remote (self-host), BuildBuddy, EngFlow

## Phase 4 — Cut over CI

Run Bazel alongside the native build in CI until output and test parity hold,
then make Bazel the source of truth and retire the native path.

## Verify

```bash
bazel build //...
bazel test //...
```

Both green across the targets you migrated means the phase is done — the same
"verify, don't assume" discipline as tool installs.
