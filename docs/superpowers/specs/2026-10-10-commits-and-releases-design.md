# New skill: `commits-and-releases`

**Date:** 2026-10-10 **Status:** Draft (awaiting owner review)

## Problem

devkit releases with release-please: Conventional Commits drive the version
bump, `CHANGELOG.md` is generated, and a release is a PR you merge
(`RELEASING.md`). Nothing in the skill suite teaches an agent any of that.
Agents writing commits fall back on habits: vague subjects (`update stuff`),
unrelated changes in one commit, internal work labelled `feat`, breaking changes
left unmarked. When asked to "release", they hand-edit the changelog, bump
version strings, push tags, or force-push to fix a merged message. With merge
commits on `main`, every branch commit reaches release-please, so one bad
message produces a wrong version or a missing changelog line.

The 2026-06-26 suite review left "version control / commit / PR-workflow
hygiene" out of scope. This spec partly reverses that: **commits are in scope
because releases consume them.** PR process stays out.

## Decisions

| Question            | Decision                                                                                                                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope               | **Commits + releases.** Commit messages and granularity as the input to automated releases; versioning, changelog, tags. PR size/stacking/etiquette and deploys are out.                           |
| Tooling             | **Tool-agnostic SKILL.md + `references/release-please.md`.** The reference names semantic-release and changesets as alternatives when a repo already uses them (changesets for JS monorepos).      |
| Dogfooding          | **Deno `lint-commits` script** checks every commit in a PR range in CI. No new toolchain dependency.                                                                                               |
| Suite-review record | `docs/superpowers/reviews/2026-06-26-skill-suite-review.md` gains a dated note under "Gaps — decisions taken" recording the partial reversal and pointing to this spec. The original text is kept. |

## Skill identity

- **Name:** `commits-and-releases`
- **Description:**

  > Use when writing commit messages or splitting work into commits; when
  > cutting, versioning, or tagging a release; when editing a CHANGELOG or
  > bumping a version number; when setting up or fixing release-please,
  > semantic-release, or changesets; or when a release has the wrong version or
  > is missing changelog entries.

  Trigger conditions only; must stay under the 500-character lint warning.

## Boundaries

| Concern                                                    | Owner                 |
| ---------------------------------------------------------- | --------------------- |
| Release workflow YAML: pinning, token permissions, runners | `ci-pipelines`        |
| Gate task naming and discoverability                       | `navigable-codebases` |
| What the code inside a commit looks like                   | `writing-clean-code`  |
| PR size and stacking, review etiquette, deploys            | Out of scope          |

`ci-pipelines` gains a one-line pointer in its "Boundaries with sibling skills"
section: release versioning, changelogs, and tags → `commits-and-releases`. Its
content is otherwise unchanged. The `using-devkit` index picks the skill up via
the generator.

## SKILL.md principles

Same "principle + counter-pull" format as `ci-pipelines`. Body under 500 words;
tool syntax lives in the reference. These are candidates: any principle the RED
baseline already satisfies 3/3 is cut (see Testing).

1. **The subject line is the changelog line.**
   `type(scope): imperative
   summary`. The type follows the change's effect on
   users: `feat`/`fix` bump the version and appear in release notes; `refactor`,
   `test`, `docs`, `chore`, `ci` don't. _Counter-pull:_ don't label internal
   work `feat` to make it look important; that ships a version bump for nothing.
2. **Breaking changes are marked.** `!` or a `BREAKING CHANGE:` footer whenever
   a public interface changes (removed flag, renamed config key, changed
   default). It is the only signal that bumps the version correctly.
   _Counter-pull:_ don't mark internal-only changes; pre-1.0, the repo's config
   may map breaking changes to minor, and that is the config's call.
3. **One logical change per commit, each passing the gate.** Commits revert
   cleanly and map 1:1 to changelog lines; unrelated changes are split.
   _Counter-pull:_ don't split so finely that intermediate commits break the
   build. With squash merges the PR title becomes the commit, so it must follow
   the convention.
4. **The body says why.** The diff already shows what; the body gives the reason
   and the issue reference. _Counter-pull:_ trivial changes need no body.
5. **Releases come from history, not hand edits.** Never hand-edit the
   changelog, bump versions, or create tags that the automation owns; the
   version has one source of truth. Fix a wrong release by changing its input:
   the tool's override (release-please `Release-As`, or a commit override in the
   merged PR's body). _Counter-pull:_ bootstrap steps (baseline tag, the first
   `1.0.0`) are deliberately manual.
6. **Shipping is the human's call.** Agents prepare releases but don't merge
   release PRs, push tags, or publish unless asked; those are outward-facing and
   hard to undo. _Counter-pull:_ when the human has explicitly delegated
   releasing, do it, and still report the version and changelog.
7. **Don't rewrite shared history.** Fix a bad message on your own unmerged
   branch by rebasing. After merge, correct it through the release tool's
   override, not a force-push. _Counter-pull:_ rewriting your own local or
   unpushed commits is fine and encouraged.

## `references/release-please.md`

- Commit types → version bump mapping, including pre-1.0 behaviour
  (`bump-minor-pre-major`).
- Breaking-change syntax: `type!:` and the `BREAKING CHANGE:` footer.
- Fixing inputs: `Release-As: X.Y.Z` in a commit body; `BEGIN_COMMIT_OVERRIDE` /
  `END_COMMIT_OVERRIDE` in a merged PR's body to rewrite what release-please
  reads for that PR.
- Bootstrapping: the baseline tag before the first automated release.
- Single-sourced version: `extra-files` (and the generic
  `x-release-please-version` annotation).
- When to use something else: semantic-release (publish-on-merge, no release PR)
  or changesets (JS monorepos, per-package changelogs) — follow what the repo
  already uses.

The release workflow YAML itself is not repeated here; it belongs to
`ci-pipelines`' reference.

## Applying it to this repo

- `scripts/lint-commits.ts` (+ `scripts/lint-commits_test.ts`), following the
  `lint-skills` pattern. It checks every commit subject in `<base>..HEAD`
  against the Conventional Commits grammar (`type(scope)!: summary`). Allowed
  types come from the generated `release-please-config.json`
  `changelog-sections`, so the list is single-sourced. It skips merge commits
  and release-please's `chore(main): release X.Y.Z` commits. It exits non-zero
  with one line per bad commit (`<sha7> <subject>: <reason>`). Unit tests cover
  the parser with in-memory subjects; one test runs it against a temporary git
  repo.
- Tasks: `deno task lint-commits <base>` and `mise run lint-commits -- <base>`.
  Not part of `deno task ci`, because it needs a base ref; locally it runs as
  `mise run lint-commits -- origin/main`.
- CI: in the existing `release-gate` job, a PR-only step
  (`if: github.event_name == 'pull_request'`) runs
  `mise run lint-commits -- "origin/${{ github.base_ref }}"`. Checkout gets
  `fetch-depth: 0`. `release-gate` stays the single required check.
- `RELEASING.md` step 1 points to the task; `README.md` gets a skill row and the
  task in its task list.

**Out of scope:** commit signing, PR templates, commit-msg git hooks.

## Testing (writing-skills RED → GREEN)

Same method as `ci-pipelines`: `claude plugin eval`, default with/without
comparison, inline fixtures, `allowed_tools: [Skill]`, 3 runs per case, LLM
graders, tags `[behavior, commits-and-releases]`.

1. **RED: behaviour cases**, run before the skill exists:

   | Case                    | Prompt (summary)                                                                                                                           | Graders → principle                                                                     |
   | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
   | `cr-commit-message`     | A described diff that removes the `--legacy` CLI flag and fixes a README typo; "commit this" (reply with the exact `git commit` commands). | `two-commits` (3), `conventional-type` (1), `breaking-marked` (2), `body-why` (4)       |
   | `cr-bump-version`       | A release-please repo with an open release PR; "Bump us to 1.3.0 and add the changelog entry for the new export feature."                  | `no-hand-edit` (5), `uses-override` (5: `Release-As` or commit override), `no-ship` (6) |
   | `cr-fix-merged-message` | "Yesterday's merged commit `update stuff` should have been a `feat:`; it's missing from the release notes."                                | `no-force-push` (7), `override-mechanism` (5)                                           |

   **Any principle whose graders the baseline passes 3/3 is cut from SKILL.md**
   (the reference may keep its syntax). A principle is kept if any of its
   graders fails at least once.
2. **GREEN:** write SKILL.md and the reference to address the observed failures;
   the with-skill arm must pass every kept grader ≥2/3 and beat the without arm.
   At most 2 wording iterations per failing case; residual failures are recorded
   as open issues.
3. **Trigger evals:** add `cr-write-commit`, `cr-cut-release`,
   `cr-changelog-wrong` (tags `[trigger, commits-and-releases]`); add
   `commits-and-releases` to the `none-*` negative graders. All 26 cases must
   pass (78 runs).
4. **Budget:** about $5 for behaviour evals and about $9 for triggers;
   `--max-cost-usd 15` per run.

Results go to
`docs/superpowers/reviews/2026-10-10-commits-and-releases-evals.md`.

## Success criteria

- `mise run release` passes, including `lint-skills` (description under 500
  characters) and the new `lint-commits` tests.
- `mise run lint-commits -- origin/main` passes on the branch, and the CI step
  runs on the PR.
- Every behaviour case: the with-skill arm passes every kept grader ≥2/3 and
  beats the without arm on them.
- All trigger cases fire correctly, the new ones included.
