# Manifest Validation — Design Spec

**Date:** 2026-06-25
**Status:** Approved, ready for implementation planning

## Problem

Devkit generates per-harness plugin manifests from a single typed source of
truth (`marketplace.config.ts` → `scripts/lib/render-json.ts`). TypeScript
guarantees the *config* is well-shaped, and `deno task check` guarantees the
files on disk match what the generator renders. Neither guarantees that the
JSON we emit **conforms to what the target harness actually expects** — a
renamed field, wrong type, bad enum value, or malformed version string would
ship undetected.

## Goal

Validate each generated JSON manifest against a schema that codifies its
harness's contract, so a malformed plugin manifest cannot pass the release
gate.

**Goal type:** conformance to the harness contract (not merely regression
against our own prior output).

## Scope

In scope — the 7 JSON manifests produced by `render-json.ts`:

- `.claude-plugin/marketplace.json`
- `.claude-plugin/plugin.json`
- `.codex-plugin/plugin.json`
- `.cursor-plugin/plugin.json`
- `.kimi-plugin/plugin.json`
- `gemini-extension.json`
- `package.json`

Explicitly **out of scope:** the `pi` (`.pi/extensions/devkit.ts`) and
`opencode` (`.opencode/plugins/devkit.js`) outputs are generated *code*, not
JSON, so JSON Schema does not apply. They remain covered by `typecheck` and
generation sync-check. This coverage boundary is intentional and stated so it
is honest rather than silent.

## Decisions

| Decision        | Choice                                                                                 |
| --------------- | -------------------------------------------------------------------------------------- |
| Failure caught  | Conformance to each harness's contract                                                 |
| Schema coverage | Best-effort schema **we author and own** for every in-scope JSON manifest              |
| Engine          | Standard JSON Schema (draft 2020-12) files validated with `@cfworker/json-schema`      |
| Library rationale | JSR-native, draft 2020-12, no `eval`/codegen — runs cleanly under Deno permissions   |
| What is validated | The **in-memory rendered output** from `renderAll()`, not files on disk             |

`@cfworker/json-schema` was chosen over `ajv` (heavier, runtime codegen friction
under Deno) and `hyperjump/json-schema` (broader async surface than needed). It
is the lightest option that fully does the job and matches the repo's
minimal, Deno-first dependency posture.

Validating the in-memory rendered output (rather than re-reading disk) is
equivalent — `deno task check` already guarantees disk equals rendered output —
and keeps the validator self-contained and unit-testable.

## Architecture

Mirror the existing skill-linter layout (`scripts/lib/lint/`) so the new code
reads like the code already in the repo:

```
scripts/
  validate-manifests.ts          # entry point (mirrors lint-skills.ts)
  validate-manifests_test.ts
  lib/validate/
    schemas/
      claude-marketplace.json
      claude-plugin.json
      codex-plugin.json
      cursor-plugin.json
      kimi-plugin.json
      gemini-extension.json
      package.json
    validate.ts                  # path -> schema map; runs validator; returns results
    validate_test.ts
    types.ts                     # ManifestViolation, ValidationResult
    report.ts                    # formats violations (mirrors lint/report.ts)
    report_test.ts
```

### Flow

1. `validate-manifests.ts` loads `marketplace.config.ts` via `loadConfig()`.
2. Calls `renderAll(config)` and filters to the JSON manifests.
3. Looks each manifest path up in the `path -> schema` map.
4. Validates the parsed content against its schema.
5. Prints a report and exits non-zero on any violation.

## Schemas

Because we author and fully control the emitted JSON, schemas are **strict** —
that strictness is the point: it catches a renamed, duplicated, or mistyped
field before it ships.

Each schema asserts:

- `type: object`, `additionalProperties: false`, an explicit `required` list.
- The injected `_generated` string field is permitted in every schema (it is
  prepended to all JSON outputs by `render-json.ts`).
- Field-level constraints encoding the real contract:
  - `version` → semver `pattern`
  - `author.email` / owner email → `format: email`
  - `brandColor` → hex-color `pattern`
  - `category`, `capabilities` → `enum`
  - `logo` / `composerIcon` → relative-path `pattern`
  - fixed values where applicable (e.g. `source: "./"`)
- Each schema file carries `$schema`, `$id`, and an `"x-provenance":
  "best-effort"` annotation so it is honest about being our codification of the
  contract, not an upstream document.

### Strictness trade-off (accepted)

`additionalProperties: false` catches our own typos, at the cost that any
genuinely-new optional field a harness adds must be added to the schema before
it can ship. This trade-off is accepted: we control exactly what we emit, so
strictness is a feature here.

## Coverage self-check (anti-rot)

The `path -> schema` mapping must be **total**:

- If any JSON manifest returned by `renderAll()` has **no** schema in the map,
  that is a hard failure — not a silent skip. The day an 8th JSON manifest is
  added to `render-json.ts`, the gate fails until a schema exists for it.
- Conversely, a schema file with no corresponding manifest is also flagged.

This is the mechanism that keeps conformance from quietly decaying as the
generator evolves.

## Integration

Add one task to `deno.json`, mirroring `lint-skills`:

```jsonc
"validate-manifests": "deno run --allow-read=. scripts/validate-manifests.ts",
```

- Insert into the `ci` task chain immediately after `check` (validate once disk
  is known in sync).
- Add the entry point to the `typecheck` task.
- Add `@cfworker/json-schema` to `deno.json` `imports`.

Because `mise run release` delegates to `deno task ci`, validation flows
automatically into pre-commit **and** GitHub Actions with no workflow edit.

## Error reporting

`report.ts` mirrors the sync-check / skill-linter output style:

- Group violations by manifest path.
- List each violation as `instancePath — message`
  (e.g. `/version — must match semver pattern`).
- Non-zero exit on any violation.
- A clean run prints `✓ all 7 manifests conform`.

## Testing

Per the repo's own `testing-practices` skill — unit-level, fast, deterministic:

- `validate_test.ts`:
  - A known-good rendered config **passes** all schemas.
  - Deliberately-mutated manifests **fail** with the expected violation — one
    case each for: missing required field, wrong type, bad enum, bad semver,
    stray field (`additionalProperties`).
- Coverage self-check tests:
  - An unmapped JSON manifest path → failure.
  - An orphan schema → failure.
- `report_test.ts`: formatting of zero / one / many violations.
- `validate-manifests_test.ts`: entry-point exit code is `0` on the real current
  config and `1` on an injected bad one.

Running the validator against the **actual current `marketplace.config.ts`**
doubles as a guarantee that today's real manifests already conform.

## Out of scope / future work

- JSON Schema validation for the pi/opencode generated code outputs (different
  technique required).
- Upgrading any best-effort schema to a vendored upstream schema if/when a
  harness publishes one (would flip `x-provenance` to `official`).
