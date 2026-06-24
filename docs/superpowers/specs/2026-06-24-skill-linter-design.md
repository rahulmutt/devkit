# Skill Linter — Design

**Date:** 2026-06-24 **Status:** Approved (pending implementation plan)

## Problem

Devkit's generator proves that per-harness _manifests_ stay in sync with
`marketplace.config.ts` (the `deno task check` drift guard). Nothing validates
the **skills themselves**. A skill can ship with malformed frontmatter, a
description long enough to be truncated, a broken `references/` link, or be
absent from the `using-devkit` primer — and CI stays green. These are exactly
the defects that silently break agent triggering, which is the entire point of
the product.

This adds a **skill linter**: a Deno check that enforces the invariants skill
content must hold, wired into the existing release gate so it runs on every
commit and in CI.

## Goals

- Catch malformed skill frontmatter before release.
- Keep skill descriptions within harness limits, and nudge toward punchy ones.
- Guarantee every `references/*.md` link resolves and every reference file is
  wired in.
- Keep the `using-devkit` registry in sync with the skills on disk and the
  harnesses declared in `marketplace.config.ts`.
- Add no new runtime dependencies; match the existing generator architecture.

## Non-goals

- Validating reference-document _content_ (prose quality, accuracy).
- Measuring whether skills actually _trigger_ (that's a separate evals project).
- Replacing or merging with the generator drift check — these are distinct
  concerns.

## Architecture

A standalone linter mirroring the generator's shape (thin entrypoint + small
`lib/` modules, each independently testable). Chosen over folding checks into
`generate.ts --check` (which would conflate "manifests in sync with config" with
"hand-written content well-formed") and over off-the-shelf tooling (more deps,
and weak on the bespoke cross-file registry checks).

```
scripts/
  lint-skills.ts            # entrypoint: run all checks, print report, exit 1 on any error
  lib/lint/
    discover.ts             # find skill dirs; parse frontmatter (name, description, body); list ref files
    discover_test.ts
    frontmatter.ts          # valid YAML, name==dir, non-empty desc, "Use when" prefix
    frontmatter_test.ts
    budget.ts               # description length: warn >500, error >1024
    budget_test.ts
    links.ts                # references/*.md mentions resolve (md links + bare prose); flag orphan ref files
    links_test.ts
    registry.ts             # every skill in using-devkit; every harness has tool-ref + mapping row
    registry_test.ts
    report.ts               # collect findings, format report, decide exit code
    report_test.ts
```

### Data shape

`discover.ts` returns one record per skill:

```ts
interface SkillRecord {
  name: string; // declared frontmatter name
  dir: string; // directory basename
  description: string; // declared frontmatter description ("" if absent)
  hasFrontmatter: boolean;
  body: string; // SKILL.md content below the frontmatter
  referenceFiles: string[]; // basenames present in references/
}
```

Each check module is a pure function `(records, context) => Finding[]` where:

```ts
interface Finding {
  level: "error" | "warn";
  skill: string; // skill name, or "<registry>" for cross-cutting checks
  message: string;
}
```

`context` carries the parsed `marketplace.config.ts` `harnesses[]` and the
`using-devkit` SKILL.md (for the registry check). Pure check functions take
their inputs as arguments so they test against in-memory fixtures with no
filesystem.

### Wiring

- New `deno.json` task:
  `"lint-skills": "deno run --allow-read=. scripts/lint-skills.ts"`.
- Append to the `ci` task chain:
  `"ci": "... && deno task lint-skills && deno task test"`.
- `ci` already flows into `mise run release` → pre-commit hook and the GitHub
  Actions release gate. No separate CI wiring is needed.

### Exit semantics

- Any `error` finding → exit 1 (fails the release gate).
- `warn` findings → printed but exit 0 (release stays green).

This split is what makes the two-tier budget meaningful.

## Checks

Levels: `error` fails the release gate; `warn` is printed only.

### frontmatter.ts

For each `skills/*/SKILL.md`:

- `error` — no parseable `---` YAML frontmatter block.
- `error` — `name` missing/empty, or `name` ≠ directory basename.
- `error` — `description` missing/empty.
- `warn` — description does not start with `Use when` (house style; a warn
  permits a deliberate exception without blocking release).

### budget.ts

Description character length:

- `error` — > 1024 (harness hard limit; risks truncation/rejection).
- `warn` — > 500 (quality nudge; long descriptions trigger less reliably).

Current longest description is 386 chars, so all skills pass clean today.

### links.ts

Reference integrity, handling **both** link styles seen in the skills: markdown
links `](references/NAME.md)` and bare prose mentions matching
`references/NAME.md`.

- `error` — a referenced `references/NAME.md` does not exist on disk.
- `warn` — a file in `references/` never mentioned by its SKILL.md (orphan; warn
  rather than error, since a reference may be loaded on demand without a prose
  mention).

### registry.ts

The cross-file drift catches — currently invisible:

- `error` — a skill directory under `skills/` not listed in `using-devkit`'s
  "Available skills" section (parsed via the `**skill-name**` bold markers).
- `error` — a harness in `marketplace.config.ts` `harnesses[]` with no
  `skills/using-devkit/references/<stem>-tools.md` file.
- `error` — a harness in `harnesses[]` missing its row in the using-devkit "How
  to invoke" mapping list.
- `warn` — a `*-tools.md` reference file or mapping row for a harness not in
  `harnesses[]` (stale leftover).

Harness→reference-stem mapping is explicit to encode the known mismatch:

```
claude   → claude-code-tools
<other>  → <other>-tools
```

(Normalizing `claude-code-tools.md` → `claude-tools.md` to remove the special
case is a possible follow-up, out of scope here.)

## Report format

Grouped, deterministic (sorted by skill, then level). Failing lines to stderr
(consistent with `generate.ts`); summary to stdout.

Findings present:

```
skill-lint: 4 skills checked

  error  testing-practices   references/missing.md linked but not found
  warn   writing-clean-code  description is 612 chars (target ≤500)

✗ 1 error, 1 warn
```

Clean run:

```
skill-lint: 4 skills checked
✓ all checks passed
```

Exit 1 iff error count > 0.

## Testing

Mirrors the generator's `*_test.ts` convention (`deno test`):

- **Per-check unit tests** drive each module with in-memory `SkillRecord`
  fixtures — synthetic, not real files — so they are fast, hermetic, and do not
  break when the real skills are edited. Each asserts the pass case and every
  failure case (e.g. `budget_test.ts`: 400 → clean, 600 → one warn, 1100 → one
  error).
- **`discover_test.ts`** (the only filesystem-touching module) runs against a
  temp fixture directory, matching `files_test.ts`.
- **One integration smoke test** runs the full linter against the real `skills/`
  tree and asserts zero errors — proving the repo is green today and turning the
  lint into a live regression guard.

## Rollout

1. Land the linter and tests; confirm `deno task lint-skills` is clean against
   the current tree.
2. Add `lint-skills` to the `ci` task chain.
3. The pre-commit hook and GitHub Actions release gate pick it up with no
   further changes.
