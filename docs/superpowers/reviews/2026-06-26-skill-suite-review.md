# Devkit skill suite — review (2026-06-26)

A four-lens review of all six skills (exposition, triggering, categorization,
unifying principles), produced by an 18-agent workflow: one deep-review agent
per skill, two cross-cutting synthesis agents (categorization + unifying
principles), and an adversarial verify pass over every proposed edit.

**Headline:** the suite is already strong. The 6-skill decomposition is correct
(no split/merge/rename warranted). 9 of 10 concrete text edits survived
adversarial verification. The highest-value opportunity is **suite-wide
consistency** — the skills read, in places, like they were written by three
different hands.

## Outcome — what was applied

All changes below were applied on branch `review/skill-suite-consistency`. The
full gate passes (`deno task ci`: lint-skills clean, generated files in sync,
fmt-check, 54 tests green). Decisions taken:

- **Structure:** kept the 6 skills (no split/merge/rename).
- **9 per-skill exposition/triggering edits:** applied (the 1 dropped edit was
  not). Edit #1 was taken further than originally proposed — see the note below
  the table.
- **Suite-wide consistency (items 1–8):** all applied, including the two
  structural reshapes (Boundaries section; drop `## The rule` headings). One
  forced deviation: `using-devkit`'s `## Available skills` list keeps **plain
  bold** skill names (not inline code) because the `lint-skills` registry rule
  matches the literal string `**skill-name**`; backticking would break the
  linter.
- **Dedup:** applied. `writing-clean-code` is the canonical owner of the
  per-language formatter/linter; `testing-practices` per-language references now
  point to it and keep only their distinct static-validation rows (typecheck,
  compiler warnings, `go vet`).
- **Gap — application/library dependencies:** brought **in scope**, owned by
  `developer-environment` (new `## Application dependencies` section;
  description broadened). Edit #1 therefore broadened "adding a dependency" to
  "adding or updating a dependency (tool, runtime, or application library)"
  rather than the originally-proposed narrowing.
- **Gap — git/commit/PR workflow:** decided **out of scope** for the suite (no
  owner added).
- **Left untouched (noted, not edited):** the two near-identical over-
  fragmentation counter-pulls in `writing-clean-code`'s "small units" / "small
  files" principles — low-priority within-skill nit, not part of items 1–8.

## Verdict on structure: keep the 6 skills

The categorization synthesis confirmed the split partitions cleanly along
non-overlapping axes (meta-index, environment/tooling, discoverability, code
authoring, validation, security) with a clean, acyclic delegation graph. No
structural change recommended. The per-skill reviewer's low-confidence flag to
split build/Bazel out of `developer-environment` was assessed at suite level and
**declined** — the build content is one section plus one reference file, and the
mise-pin idiom genuinely ties Bazel back to tool installation. Revisit only if
build/CI-orchestration content grows substantially.

## Per-skill edits (9 verified, exposition + triggering)

All concrete, with exact before/after; each passed an adversarial skeptic that
confirmed the BEFORE text exists, the change is lossless, and it stays lint-safe
(keeps `Use when`, preserves reference links and the registry).

| # | Skill                 | Lens       | Change                                                                                                                        |
| - | --------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1 | developer-environment | triggering | `adding a dependency` → `adding or updating a dependency (tool, runtime, or application library)` (app-deps brought in scope) |
| 2 | developer-environment | exposition | verify snippet: note the binary's real name may differ (`rg` for ripgrep)                                                     |
| 3 | navigable-codebases   | exposition | reword the "named command … runner installs" parenthetical so it doesn't read as if dev-env installs the workflows            |
| 4 | security-practices    | triggering | add `writing or revisiting a threat model` to the description                                                                 |
| 5 | testing-practices     | triggering | enumerate golden/snapshot, simulation/DST, and suite-maintenance/velocity in the description                                  |
| 6 | testing-practices     | exposition | backtick `references/formal-methods.md` in the formal-verification matrix row                                                 |
| 7 | using-devkit          | triggering | add `or new engineering task` so the router fires mid-conversation                                                            |
| 8 | using-devkit          | exposition | `## The Rule` → `## The rule` (sentence case)                                                                                 |
| 9 | writing-clean-code    | triggering | add `simplifying`, `name things in the domain's language`, `delete dead code (YAGNI)`                                         |

**Dropped (1):** navigable-codebases `references/agent-instruction-files.md` —
adding `GEMINI.md` to a one-instance example. The verifier dropped it: both
files are already named two sentences earlier; the change adds no information.

## Suite-wide consistency (unifying-principles pass)

Seven inconsistencies, ordered low→high invasiveness:

1. **Heading case** — `## The Rule` (using-devkit) is the only title-case
   heading; the suite is otherwise sentence case. (Same as edit #8.)
2. **Backtick discipline** — one reference path written bare vs. in code. (Same
   as edit #6.)
3. **Clickable reference links** — `developer-environment` writes reference
   paths as bare inline code (not clickable); the other four content skills use
   `[`references/x.md`](references/x.md)`. Normalize dev-env to clickable links.
4. **Counterpart cross-link symmetry** — `writing-clean-code` names
   `testing-practices` its validating counterpart, and `using-devkit` implies
   the pairing, but `testing-practices` never reciprocates. Add a one-line
   back-reference.
5. **Skill-name typesetting** — names appear three ways:
   ``**`developer-environment`**``, `` `developer-environment` ``, and
   plain-bold **developer-environment**. `testing-practices` uses two within one
   file. Rule: always inline code `` `skill-name` ``; bold only at the single
   delegation call-out.
6. **Per-language reference-list phrasing** — the three skills shipping the same
   five `typescript/python/rust/go/haskell` references describe them three
   different ways. Pick one presentation.
7. **Delegation section shape** — `security/testing/writing-clean-code` use a
   prose `## Installing tools` section; `navigable-codebases` uses a
   `## Boundaries with sibling skills` arrow-bullet list. Standardize on one
   (the Boundaries shape generalizes; "installing tools" is its
   single-delegation special case).
8. **Core-rule treatment** — four skills front-load the rule as unlabeled lead
   prose; `developer-environment` and `using-devkit` give it a `## The rule`
   heading. Pick one (lead prose is the majority pattern).

Items 1–6 are safe formatting normalizations. Items 7–8 are structural reshapes
(they move/relabel sections) and are the judgment calls.

### Proposed skill template (if we standardize)

Front-load the rule as lead prose under the H1 (no `## The rule` heading);
sentence-case headings; skill names as inline code, bold only at the delegation
call-out; a single `## Boundaries with sibling skills` arrow-bullet section;
`## References` with clickable links and an identical per-language block.
Exceptions by design: `developer-environment` is the install target (no
delegation section) and may keep `## Templates`; `using-devkit` is the index
(keeps `## Available skills` / `## How to invoke a skill`).

### Shared principles worth stating once

Front-load the governing rule; counter-pull discipline (name the failure _and_
the over-application); delegate all tool install to `developer-environment` with
identical phrasing; gate stances use "non-negotiable hygiene, not optional
polish"; optimize for the next reader (often an agent with a bounded context
window); single source of truth (link, don't duplicate); match the form to the
failure/boundary (selection tables with a "Reach for it when" column); pin for
reproducibility.

## Categorization notes

- **Move-content (dedup):** `writing-clean-code` and `testing-practices`
  per-language references independently list the same formatter/linter tools and
  invocations (e.g. `eslint .`, prettier) — duplication that can drift. Pick one
  owner (most naturally `writing-clean-code`, which owns canonical style) and
  have the other reference it. The conceptual boundary stays; only the literal
  list is single-sourced.
- **Acceptable shared motifs (no action):** the "legibility and locality serve
  both audiences" framing (clean-code ↔ navigable) and the "non-negotiable
  hygiene" stance (security ↔ testing) are intentional connective tissue.

## Gaps — decisions taken

Both were "falls between skills" areas at review time. Resolved:

- **Application/library dependency management** (choosing/pinning/updating a
  package in `package.json`/`Cargo.toml`/`go.mod`) → **brought in scope**, owned
  by `developer-environment`. Added a `## Application dependencies` section
  (toolchain vs. package-manager split, commit-the-lockfile, dependency-as-
  liability, update cadence) and broadened the description; CVE scanning stays
  delegated to `security-practices`.
- **Version control / commit / PR-workflow hygiene** → **deliberately left out
  of suite scope.** No owner added. Revisit if the suite later expands to cover
  collaboration process; the most plausible home would be a new skill rather
  than stretching `navigable-codebases`.

## Method

Workflow `devkit-skill-review` (run `wf_7c8be227-33b`): 6 review + 2 synthesis +
10 verify agents, 271k tokens. Mechanics already enforced by `lint-skills`
(frontmatter, `name`==dir, `Use when` prefix, reference-link integrity, registry
listing) were out of scope by design — this review targets quality the linter
can't see.
