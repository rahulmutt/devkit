# commits-and-releases Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a `commits-and-releases` devkit skill. It covers Conventional
Commits as the input to automated releases, breaking-change marking, atomic
commits, why-bodies, no hand-edited releases, shipping as the human's call, and
no rewritten shared history. Before/after evals prove it works. devkit enforces
the convention on itself with a `lint-commits` check in CI.

**Architecture:** `skills/commits-and-releases/SKILL.md` is tool-agnostic and
states the principles, each with a counter-pull. `references/release-please.md`
holds the tool syntax. Behaviour evals run before the skill exists (RED) and
after (GREEN). Any principle the baseline already passes 3/3 is cut. A Deno
script, `scripts/lint-commits.ts`, validates commit subjects in a range against
the types in the generated `release-please-config.json`. It is exposed as a
deno/mise task and runs as a PR-only step in the existing `release-gate` CI job.

**Tech Stack:** Markdown skills, Deno (scripts and `@std/assert` tests), mise
tasks, `claude plugin eval` (2.1.296), GitHub Actions, release-please.

**Spec:** `docs/superpowers/specs/2026-10-10-commits-and-releases-design.md`

## Global Constraints

- Skill name `commits-and-releases`; directory `skills/commits-and-releases/`.
- Description, verbatim (lint warns over 500 characters):
  `Use when writing commit messages or splitting work into commits; when cutting, versioning, or tagging a release; when editing a CHANGELOG or bumping a version number; when setting up or fixing release-please, semantic-release, or changesets; or when a release has the wrong version or is missing changelog entries.`
- SKILL.md body (after the frontmatter) under 500 words. Tool syntax goes in
  `references/release-please.md`.
- The skill never gives install commands.
- Commit overrides (`BEGIN_COMMIT_OVERRIDE`) work only for squash-merged PRs.
  With plain merge commits, the fix is a new (possibly empty) commit carrying
  the correct type. Verified against the release-please README on 2026-10-10.
- Allowed commit types come from `release-please-config.json`
  `changelog-sections[].type`. Never hard-code a second list.
- Never hand-edit generated files (`skills/using-devkit/SKILL.md` index region,
  manifests, `release-please-config.json`). Run `deno task generate` instead.
- `mise run release` must pass at the end of every task.
- Every commit on this branch is itself a Conventional Commit. `lint-commits`
  checks the branch in Task 4.
- Work on branch `feat/commits-and-releases-skill`.
- Eval spend is about $5 for behaviour evals and $9 for triggers. Pass
  `--max-cost-usd 15` on every run. Never add `append_system_prompt` nudging
  skill use.

## Review Focus

1. **`git revert` commits** (`Revert "feat: add x"`) must pass `lint-commits`,
   because release-please understands them. Tested in Task 4 Step 1
   (`accepts conventional and revert subjects`).
2. **Merge commits** in the range (CI checks out the PR merge ref) must be
   skipped, not flagged. Tested in Task 4 Step 1
   (`commitsInRange skips merge
   commits`).
3. **An unknown or unfetched base ref** (for example `origin/main` missing in a
   shallow clone) must exit 2 with a clear `lint-commits:` message, not a stack
   trace. Tested in Task 4 Step 1 (`commitsInRange throws on an unknown base`),
   and handled in `main()` in Step 3.
4. **An empty range** (a branch with no new commits) must pass and report
   `0 commit(s) checked`. Tested in Task 4 Step 1
   (`commitsInRange returns nothing for an empty range`).
5. **Scopes with hyphens or slashes and the `!` marker**
   (`feat(ci-pipelines)!: x`, `fix(scripts/lib): y`) must be accepted, while
   `feat:x`, `feat:` and `Feat: x` are rejected. Tested in Task 4 Step 1.

## File Structure

| Path                                                                           | Responsibility                                                 |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `evals/cr-commit-message/`                                                     | Behaviour case: "commit this" (4 LLM graders)                  |
| `evals/cr-bump-version/`                                                       | Behaviour case: "bump to 1.3.0 + changelog" (3 LLM graders)    |
| `evals/cr-fix-merged-message/`                                                 | Behaviour case: "merged commit had the wrong type" (2 graders) |
| `docs/superpowers/reviews/2026-10-10-commits-and-releases-evals.md`            | RED/GREEN results and cut decisions                            |
| `skills/commits-and-releases/SKILL.md`                                         | Principles with counter-pulls, and boundaries                  |
| `skills/commits-and-releases/references/release-please.md`                     | release-please syntax and alternatives                         |
| `skills/ci-pipelines/SKILL.md`                                                 | One-line boundary pointer to commits-and-releases              |
| `docs/superpowers/reviews/2026-06-26-skill-suite-review.md`                    | Dated note: partial reversal of the scope decision             |
| `evals/cr-write-commit/`, `evals/cr-cut-release/`, `evals/cr-changelog-wrong/` | Trigger cases                                                  |
| `scripts/lib/lint/commits.ts`, `scripts/lib/lint/commits_test.ts`              | Subject grammar, range listing, problem formatting             |
| `scripts/lint-commits.ts`                                                      | CLI entry: args, config read, exit codes                       |
| `deno.json`, `mise.toml`                                                       | `lint-commits` task; `test` task gains `--allow-run=deno,git`  |
| `.github/workflows/ci.yml`                                                     | `fetch-depth: 0`, PR-only `lint-commits` step                  |
| `RELEASING.md`, `README.md`                                                    | Pointer to the task, skill row, task list                      |

---

### Task 1: Behaviour evals and RED baseline

**Files:**

- Create: `evals/cr-commit-message/prompt.md`,
  `evals/cr-commit-message/graders/{two-commits,conventional-type,breaking-marked,body-why}.md`
- Create: `evals/cr-bump-version/prompt.md`,
  `evals/cr-bump-version/graders/{no-hand-edit,uses-override,no-ship}.md`
- Create: `evals/cr-fix-merged-message/prompt.md`,
  `evals/cr-fix-merged-message/graders/{no-force-push,merge-aware-fix}.md`
- Create: `docs/superpowers/reviews/2026-10-10-commits-and-releases-evals.md`

**Interfaces:**

- Consumes: the existing `eval-behavior` task (`deno task eval-behavior` runs
  `claude plugin eval . --tag behavior --no-publish`).
- Produces: case names `cr-commit-message`, `cr-bump-version`, and
  `cr-fix-merged-message`, tagged `behavior` and `commits-and-releases` (never
  `trigger`). Also the RED table and cut decisions that Task 2 consumes.

- [ ] **Step 1: Write `evals/cr-commit-message/prompt.md`**

```markdown
---
max_turns: 8
runs: 3
tags: [behavior, commits-and-releases]
allowed_tools: [Skill]
---

You're working in a CLI tool's repo that releases with release-please from
Conventional Commits. Your working tree has two uncommitted changes:

1. `src/cli.ts`: the `--legacy` flag is removed. Users who pass it now get
   "unknown option". It was removed because the legacy output format was
   deprecated two releases ago and blocks the new renderer (issue #212).
2. `README.md`: fixes the typo "recieve" → "receive".

Commit this. Reply with the exact `git add` / `git commit` commands you would
run, including the full commit messages. Don't ask questions.
```

- [ ] **Step 2: Write the four graders for `cr-commit-message`**

`graders/two-commits.md`:

```markdown
---
type: llm
---

PASS if the reply creates two separate commits: one for the `--legacy` flag
removal and one for the README typo. FAIL if both changes go into one commit.
```

`graders/conventional-type.md`:

```markdown
---
type: llm
---

PASS if every commit subject has the Conventional Commits form
`type(optional scope)(optional !): summary`, and the README typo commit uses the
`docs` type. FAIL if any subject isn't in that form, or if the typo commit is
typed `fix` or `feat`. Those types would put a docs typo in the release notes
and bump the version.
```

`graders/breaking-marked.md`:

```markdown
---
type: llm
---

PASS if the commit removing the `--legacy` flag marks a breaking change, either
with `!` after the type or scope (e.g. `feat(cli)!:`) or with a
`BREAKING CHANGE:` footer. FAIL if it has neither marker.
```

`graders/body-why.md`:

```markdown
---
type: llm
---

PASS if the flag-removal commit has a body that explains why the flag was
removed (the legacy format was deprecated and blocks the new renderer) and
references issue #212. FAIL if it has no body, or the body only restates what
changed.
```

- [ ] **Step 3: Write `evals/cr-bump-version/prompt.md`**

```markdown
---
max_turns: 8
runs: 3
tags: [behavior, commits-and-releases]
allowed_tools: [Skill]
---

This GitHub repo releases with release-please: `release-please-config.json`,
`.release-please-manifest.json` at `1.2.4`, and a generated `CHANGELOG.md`. PRs
are squash-merged. release-please has an open PR "chore(main): release 1.2.5".
The new CSV export feature was merged last week as PR #41, titled
`chore: add csv export`.

Bump us to 1.3.0 and add the changelog entry for the new export feature. Reply
with exactly what you would change or run. Don't ask questions.
```

- [ ] **Step 4: Write the three graders for `cr-bump-version`**

`graders/no-hand-edit.md`:

```markdown
---
type: llm
---

PASS if the reply does not hand-edit `CHANGELOG.md`,
`.release-please-manifest.json`, or any version string, including the files on
the open release PR's branch. FAIL if it proposes any of those edits.
```

`graders/uses-override.md`:

```markdown
---
type: llm
---

PASS if the reply changes what release-please reads. Two ways count: editing
merged PR #41's body to add a `BEGIN_COMMIT_OVERRIDE` / `END_COMMIT_OVERRIDE`
block with a `feat:` message, or adding a commit with a `Release-As: 1.3.0`
footer (ideally both). FAIL if it does neither.
```

`graders/no-ship.md`:

```markdown
---
type: llm
---

PASS if the reply does not itself merge the release PR, push a tag, or create a
GitHub Release. Saying the human merges the release PR when they're ready is
fine. FAIL if the reply merges, tags, or publishes.
```

- [ ] **Step 5: Write `evals/cr-fix-merged-message/prompt.md` and graders**

`prompt.md`:

```markdown
---
max_turns: 8
runs: 3
tags: [behavior, commits-and-releases]
allowed_tools: [Skill]
---

This GitHub repo releases with release-please from Conventional Commits and
merges PRs with plain merge commits (no squash). Yesterday PR #48 was merged to
`main`. It contains a commit `update stuff` that added the `--json` output flag.
That commit should have been a `feat:`, and the flag is missing from the release
notes in the open release PR.

Fix it. Reply with exactly what you would do or run. Don't ask questions.
```

`graders/no-force-push.md`:

```markdown
---
type: llm
---

PASS if the reply doesn't rewrite `main`'s history. That means no rebase or
amend of the merged commit, no `git push --force` or `--force-with-lease` to
`main`, and no reverting and re-merging just to change the message. FAIL if it
proposes any of these.
```

`graders/merge-aware-fix.md`:

```markdown
---
type: llm
---

PASS if the fix is a new commit on `main` (an empty commit is fine) whose
subject has the correct type, e.g. `feat: add --json output flag`, so
release-please picks it up. FAIL if the reply relies only on a
`BEGIN_COMMIT_OVERRIDE` block in PR #48's body. release-please ignores that
override for plain merge commits.
```

- [ ] **Step 6: Run the RED baseline**

The skill doesn't exist yet, so the with-plugin arm is the baseline.

Run:
`claude plugin eval . --tag commits-and-releases --tag behavior --ablation none --trust-plugin --no-publish --max-cost-usd 15 --threshold 0 --json evals/results/cr-red.json`

If `--tag` doesn't combine as AND, use
`--case cr-commit-message --case cr-bump-version --case cr-fix-merged-message`
instead (check `claude plugin eval --help`). Don't re-run the ci-pipelines
cases.

Expected: the run completes and writes `evals/results/cr-red.json`, which is
gitignored. Print the per-grader pass counts:

```bash
python3 -c "
import json; d = json.load(open('evals/results/cr-red.json'))
for c in d['cases']:
    runs = c['arms']['with']
    for i, g in enumerate(runs[0]['graders']):
        print(f\"{c['name']:22} {g['name']:18} {sum(r['graders'][i]['passed'] for r in runs)}/{len(runs)}\")
"
```

- [ ] **Step 7: Record RED results and decide cuts**

Create `docs/superpowers/reviews/2026-10-10-commits-and-releases-evals.md`:

```markdown
# commits-and-releases evals

## RED (no skill), 3 runs per case

The RED arm is the with-plugin arm under `--ablation none`, run before the skill
existed. 3 runs per case is coarse.

| Case                                      | Grader | Pass | Principle | Decision |
| ----------------------------------------- | ------ | ---- | --------- | -------- |
| <one row per grader from Step 6's output> |        |      |           |          |

Rule (from the spec): a principle is cut from SKILL.md only if the baseline
passes every one of its graders 3/3. It is kept if any of its graders fails at
least once. The reference may keep the syntax for cut principles.
```

Principle mapping:

| Grader            | Principle |
| ----------------- | --------- |
| two-commits       | 3         |
| conventional-type | 1         |
| breaking-marked   | 2         |
| body-why          | 4         |
| no-hand-edit      | 5         |
| uses-override     | 5         |
| merge-aware-fix   | 5         |
| no-ship           | 6         |
| no-force-push     | 7         |

Fill the Decision column per principle and add one line listing the kept and cut
principles.

- [ ] **Step 8: Verify and commit**

Run `deno fmt && mise run release`. Expected: PASS (exit 0).

```bash
git add evals/cr-commit-message evals/cr-bump-version evals/cr-fix-merged-message docs/superpowers/reviews/2026-10-10-commits-and-releases-evals.md
git commit -m "test(evals): add commits-and-releases behaviour evals and RED baseline"
```

---

### Task 2: Write the skill (GREEN)

**Files:**

- Create: `skills/commits-and-releases/SKILL.md`
- Create: `skills/commits-and-releases/references/release-please.md`
- Modify: `skills/ci-pipelines/SKILL.md` ("Boundaries with sibling skills")
- Modify: `docs/superpowers/reviews/2026-06-26-skill-suite-review.md` ("Gaps —
  decisions taken")
- Modify (generated): `skills/using-devkit/SKILL.md`, via `deno task generate`
- Modify: `docs/superpowers/reviews/2026-10-10-commits-and-releases-evals.md`

**Interfaces:**

- Consumes: the RED table and cut decisions from Task 1.
- Produces: skill `commits-and-releases`, listed in the primer index as
  `**commits-and-releases**`.

- [ ] **Step 1: Write `skills/commits-and-releases/SKILL.md`**

Leave out every principle Task 1 marked "cut". Also adjust the intro paragraph
so it claims only what the kept principles cover.

```markdown
---
name: commits-and-releases
description: Use when writing commit messages or splitting work into commits; when cutting, versioning, or tagging a release; when editing a CHANGELOG or bumping a version number; when setting up or fixing release-please, semantic-release, or changesets; or when a release has the wrong version or is missing changelog entries.
---

# Commits and Releases

Commit history is the input to the release: release tooling reads each subject
to pick the version bump and write the changelog. Write commits for that reader,
and change releases only by changing their input. Tool syntax:
[`references/release-please.md`](references/release-please.md).

## Principles — each with its counter-pull

### The subject line is the changelog line

`type(scope): imperative summary`. Pick the type by the change's effect on
users: `feat` and `fix` bump the version and appear in release notes;
`refactor`, `perf`, `test`, `docs`, `chore`, `ci`, `build`, `style` describe
work users don't see. A docs typo is `docs`, never `fix`. Counter-pull: don't
label internal work `feat` to make it look important; that ships a version bump
for nothing.

### Breaking changes are marked

When a public interface changes (a removed flag, a renamed config key, a changed
default), mark it with `!` after the type or scope (`feat(cli)!:`) or a
`BREAKING CHANGE:` footer. The marker is the only signal that bumps the version
correctly. Counter-pull: don't mark internal-only changes; pre-1.0, the repo's
release config decides what a breaking change bumps.

### One logical change per commit, each passing the gate

Split unrelated changes, even when they arrive together. Each commit reverts
cleanly and maps to one changelog line. Counter-pull: don't split so finely that
an intermediate commit breaks the build. With squash merges, the PR title
becomes the commit, so it follows the convention too.

### The body says why

The diff shows what changed. The body gives the reason and the issue reference
(`Refs #212`). Counter-pull: a trivial change needs no body.

### Releases come from history, not hand edits

Never hand-edit the changelog, bump version strings, or create tags that the
release automation owns. Fix a wrong release by changing its input. Use a
`Release-As: X.Y.Z` footer for the version. For a mistyped merged commit, use a
commit override in the merged PR's body (squash merges only), or with plain
merge commits, a new commit with the correct type. Counter-pull: bootstrap steps
(the baseline tag, the first `1.0.0`) are deliberately manual.

### Shipping is the human's call

Prepare the release; don't merge the release PR, push tags, or publish unless
asked. Those steps are outward-facing and hard to undo. Counter-pull: when the
human has explicitly delegated releasing, do it, and report the version and
changelog.

### Don't rewrite shared history

Fix a bad message on your own unmerged branch by rebasing. After merge, fix it
through the release input (above), never a force-push to a shared branch.
Counter-pull: rewriting your own local or unpushed commits is fine and
encouraged.

## Boundaries with sibling skills

- Release workflow YAML: pinning, token permissions, runners →
  **`ci-pipelines`**.
- Exposing the gate as a named task → **`navigable-codebases`**.
- What the code inside a commit looks like → **`writing-clean-code`**.
- Out of scope: PR size and stacking, review etiquette, deploys.
```

- [ ] **Step 2: Write
      `skills/commits-and-releases/references/release-please.md`**

````markdown
# release-please

Concrete forms of each `commits-and-releases` principle for
[release-please](https://github.com/googleapis/release-please). Verified against
its README on 2026-10-10.

## Types and version bumps

| Commit                                | 1.x and later | Pre-1.0 with `bump-minor-pre-major: true`         |
| ------------------------------------- | ------------- | ------------------------------------------------- |
| `fix:` / `perf:`                      | patch         | patch                                             |
| `feat:`                               | minor         | minor (patch if `bump-patch-for-minor-pre-major`) |
| `type!:` or `BREAKING CHANGE:` footer | major         | minor                                             |
| `docs:`, `chore:`, `test:`, `ci:`, …  | none          | none                                              |

Which types appear in the changelog comes from `changelog-sections` in
`release-please-config.json`. Hidden sections still parse, but they don't
produce a release on their own.

## Breaking changes

```text
feat(cli)!: remove the --legacy flag

The legacy output format was deprecated in 1.0 and blocks the new renderer.

BREAKING CHANGE: `--legacy` is gone; use `--format=v1` for the old layout.
Refs #212
```

## Fixing the input, not the output

Force the next version with a `Release-As` footer in any commit body on the
default branch:

```bash
git commit --allow-empty -m "chore: release 2.0.0" -m "Release-As: 2.0.0"
```

To fix a mistyped commit in a **squash-merged** PR, edit the merged PR's body:

```text
BEGIN_COMMIT_OVERRIDE
feat: add CSV export
END_COMMIT_OVERRIDE
```

release-please uses this the next time it runs.

> **Plain merge commits ignore the override.** release-please can't tell which
> commit the override applies to. Add a new commit with the correct type
> instead, e.g. `git commit --allow-empty -m "feat: add --json output flag"`.

## Bootstrapping

Before the first automated release, tag the baseline so release-please doesn't
restate all history:

```bash
git tag -a v0.1.0 -m "Baseline release before automated releasing"
```

Cut `1.0.0` deliberately, with `Release-As: 1.0.0`.

## One source for the version

List every file that carries the version in `extra-files`. For files with no
structured format, annotate the line:

```ts
export const version = "0.3.0"; // x-release-please-version
```

## When to use something else

Follow what the repo already uses:

- **semantic-release:** publishes on every merge, with no release PR. The same
  commit grammar applies.
- **changesets:** common in JS monorepos. Each PR adds a `.changeset/*.md` file
  that names the bump per package. Write the changeset; don't hand-edit
  versions.
````

- [ ] **Step 3: Add the boundary pointer and the suite-review note**

In `skills/ci-pipelines/SKILL.md`, under `## Boundaries with sibling skills`,
append:

```markdown
- Release versioning, changelogs, and tags → **`commits-and-releases`**.
```

In `docs/superpowers/reviews/2026-06-26-skill-suite-review.md`, at the end of
`## Gaps — decisions taken` (before `## Method`), append:

```markdown
- **Update 2026-10-10:** commits are now in scope, owned by
  `commits-and-releases`, because release automation consumes them (see
  `docs/superpowers/specs/2026-10-10-commits-and-releases-design.md`). PR
  process (size, stacking, review etiquette) stays out of scope.
```

- [ ] **Step 4: Regenerate and lint**

Run:
`deno task generate && deno task lint-skills && awk 'f>=2{print} /^---$/{f++}' skills/commits-and-releases/SKILL.md | wc -w`

Expected: `✓ all checks passed`. `skills/using-devkit/SKILL.md` lists
`**commits-and-releases**`. The body word count is under 500.

- [ ] **Step 5: Run the GREEN evals**

Run the same case selection as Task 1 Step 6, without `--ablation none` (so both
arms run), writing `--json evals/results/cr-green.json`. Print per-grader pass
counts for both `c['arms']['with']` and `c['arms']['without']`.

Expected: every kept grader passes at least 2/3 in the `with` arm, and beats the
`without` arm or the RED count.

- [ ] **Step 6: If a grader still fails, tighten the wording and rerun**

Read the failing run's final message (pass `--keep-temp` to keep the traces).
The evals allow only the `Skill` tool, so the model cannot open `references/`.
Anything a grader needs must be in SKILL.md. Classify the failure using the
"Match the Form to the Failure" table in writing-skills, then edit only the
relevant principle. Rerun just that case (`--case <name>`). Do at most 2
iterations. If it still fails, record it as an open issue in the review doc.

- [ ] **Step 7: Record GREEN results, verify, commit**

Append a `## GREEN (with skill)` table (case, grader, with, without) to the
evals doc. Add any Step 6 wording changes and the reason for each.

Run `deno fmt && mise run release`. Expected: PASS.

```bash
git add skills/commits-and-releases skills/ci-pipelines/SKILL.md skills/using-devkit/SKILL.md docs/superpowers/reviews/2026-06-26-skill-suite-review.md docs/superpowers/reviews/2026-10-10-commits-and-releases-evals.md
git commit -m "feat(skills): add commits-and-releases skill"
```

---

### Task 3: Trigger evals

**Files:**

- Create: `evals/cr-write-commit/`, `evals/cr-cut-release/`,
  `evals/cr-changelog-wrong/` (each with `prompt.md` and
  `graders/skill-fired.md`)
- Modify: `evals/none-*/graders/no-devkit-skill.md`

**Interfaces:**

- Consumes: skill name `commits-and-releases` from Task 2.

- [ ] **Step 1: Write the three trigger cases**

Each `prompt.md` uses this frontmatter:

```markdown
---
max_turns: 6
runs: 3
tags: [trigger, commits-and-releases]
allowed_tools: [Read, Glob, Grep, Skill]
---
```

Prompts:

- `cr-write-commit`:
  `I've finished the retry-backoff change in src/http.ts. Write the commit for it.`
- `cr-cut-release`:
  `We're ready to ship the next version. How do we cut the release?`
- `cr-changelog-wrong`:
  `Our last release came out as 2.4.1 but it added a new feature, and the feature isn't in the CHANGELOG. What went wrong and how do we fix it?`

Each `graders/skill-fired.md`:

```markdown
---
type: tool_used
tool: Skill
input_match: '"skill"\s*:\s*"(?:[\w-]+:)?commits-and-releases"'
arm: both
---
```

- [ ] **Step 2: Extend the negative graders**

In each `evals/none-*/graders/no-devkit-skill.md`, add `commits-and-releases` to
the `input_match` alternation:

```yaml
input_match: '"skill"\s*:\s*"(?:[\w-]+:)?(?:developer-environment|testing-practices|security-practices|writing-clean-code|navigable-codebases|ci-pipelines|commits-and-releases)"'
```

- [ ] **Step 3: Run the full trigger suite**

Run:
`mise run eval-triggers -- --trust-plugin --max-cost-usd 15 --threshold 0 --json evals/results/cr-triggers.json`

Expected: 26 cases and 78/78 runs pass. If any of the 23 existing cases
regresses (the last run was 69/69), report it with evidence before changing any
description. The new description is mandated verbatim.

- [ ] **Step 4: Verify and commit**

Run `deno fmt && mise run release`. Expected: PASS.

```bash
git add evals
git commit -m "test(evals): add commits-and-releases trigger cases"
```

---

### Task 4: `lint-commits` and applying it to devkit

**Files:**

- Create: `scripts/lib/lint/commits.ts`, `scripts/lib/lint/commits_test.ts`,
  `scripts/lint-commits.ts`
- Modify: `deno.json` (`lint-commits` task; `test` gets `--allow-run=deno,git`),
  `mise.toml` (`lint-commits` task)
- Modify: `.github/workflows/ci.yml`, `RELEASING.md`, `README.md`

**Interfaces:**

- Produces (in `scripts/lib/lint/commits.ts`):
  - `interface Commit { sha: string; subject: string }`
  - `allowedTypes(config: { "changelog-sections": { type: string }[] }): string[]`
  - `checkSubject(subject: string, types: readonly string[]): string | null`.
    Returns `null` when valid, otherwise the reason.
  - `lintCommits(commits: readonly Commit[], types: readonly string[]): string[]`.
    Returns lines of the form `<sha7> <subject>: <reason>`.
  - `parseLog(output: string): Commit[]`
  - `commitsInRange(base: string, cwd: string): Promise<Commit[]>`. Throws
    `Error("git log <base>..HEAD failed: …")` on a git error.
- Produces: `deno task lint-commits <base>` and
  `mise run lint-commits -- <base>`. Exit codes: 0 when clean, 1 when there are
  problems, 2 on a usage or git error.

- [ ] **Step 1: Write the failing tests, `scripts/lib/lint/commits_test.ts`**

```ts
// scripts/lib/lint/commits_test.ts
import { assertEquals, assertRejects } from "@std/assert";
import { fromFileUrl } from "@std/path";
import {
  allowedTypes,
  checkSubject,
  commitsInRange,
  lintCommits,
  parseLog,
} from "./commits.ts";

const TYPES = ["feat", "fix", "docs", "chore", "test", "ci"];

Deno.test("accepts conventional and revert subjects", () => {
  for (
    const s of [
      "feat: add csv export",
      "fix(ci-pipelines): pin checkout",
      "feat(scripts/lib)!: drop legacy flag",
      "docs(specs): add the commits-and-releases skill design",
      "chore(main): release 0.3.0",
      'Revert "feat: add csv export"',
    ]
  ) {
    assertEquals(checkSubject(s, TYPES), null, s);
  }
});

Deno.test("rejects malformed subjects with a reason", () => {
  assertEquals(
    checkSubject("update stuff", TYPES),
    "not `type(scope)!: summary`",
  );
  assertEquals(
    checkSubject("Feat: add x", TYPES),
    "not `type(scope)!: summary`",
  );
  assertEquals(
    checkSubject("feat:add x", TYPES),
    "not `type(scope)!: summary`",
  );
  assertEquals(checkSubject("feat: ", TYPES), "not `type(scope)!: summary`");
  assertEquals(
    checkSubject("fixup! feat: add x", TYPES),
    "not `type(scope)!: summary`",
  );
  assertEquals(
    checkSubject("wip(x): y", TYPES),
    'unknown type "wip" (allowed: feat, fix, docs, chore, test, ci)',
  );
});

Deno.test("lintCommits formats one line per bad commit", () => {
  const problems = lintCommits([
    { sha: "0123456789abcdef", subject: "feat: fine" },
    { sha: "fedcba9876543210", subject: "update stuff" },
  ], TYPES);
  assertEquals(problems, [
    "fedcba9 update stuff: not `type(scope)!: summary`",
  ]);
});

Deno.test("parseLog splits sha and subject on the first tab", () => {
  assertEquals(parseLog("abc\tfeat: a\tb\ndef\tfix: c\n"), [
    { sha: "abc", subject: "feat: a\tb" },
    { sha: "def", subject: "fix: c" },
  ]);
});

Deno.test("allowedTypes reads the generated release-please config", async () => {
  const path = fromFileUrl(
    new URL("../../../release-please-config.json", import.meta.url),
  );
  const types = allowedTypes(JSON.parse(await Deno.readTextFile(path)));
  for (const t of ["feat", "fix", "docs", "chore", "test", "ci"]) {
    assertEquals(types.includes(t), true, t);
  }
});

async function git(cwd: string, ...args: string[]): Promise<string> {
  const { code, stdout, stderr } = await new Deno.Command("git", {
    args: [
      "-c",
      "user.name=t",
      "-c",
      "user.email=t@example.com",
      "-c",
      "commit.gpgsign=false",
      ...args,
    ],
    cwd,
  }).output();
  if (code !== 0) throw new Error(new TextDecoder().decode(stderr));
  return new TextDecoder().decode(stdout).trim();
}

async function repoWithBranch(): Promise<string> {
  const dir = await Deno.makeTempDir();
  await git(dir, "init", "-q", "-b", "main");
  await git(dir, "commit", "-q", "--allow-empty", "-m", "chore: base");
  await git(dir, "switch", "-q", "-c", "side");
  await git(dir, "commit", "-q", "--allow-empty", "-m", "feat: side work");
  await git(dir, "switch", "-q", "main");
  await git(dir, "commit", "-q", "--allow-empty", "-m", "fix: main work");
  await git(dir, "switch", "-q", "-c", "topic");
  await git(dir, "merge", "-q", "--no-ff", "-m", "Merge branch 'side'", "side");
  await git(dir, "commit", "-q", "--allow-empty", "-m", "update stuff");
  return dir;
}

Deno.test("commitsInRange skips merge commits", async () => {
  const dir = await repoWithBranch();
  try {
    const subjects = (await commitsInRange("main", dir)).map((c) => c.subject)
      .sort();
    assertEquals(subjects, ["feat: side work", "update stuff"]);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("commitsInRange returns nothing for an empty range", async () => {
  const dir = await repoWithBranch();
  try {
    assertEquals(await commitsInRange("topic", dir), []);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("commitsInRange throws on an unknown base", async () => {
  const dir = await repoWithBranch();
  try {
    await assertRejects(
      () => commitsInRange("origin/nope", dir),
      Error,
      "git log origin/nope..HEAD failed",
    );
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
```

- [ ] **Step 2: Grant `git` to the test task and run the tests (expect FAIL)**

In `deno.json`, change the `test` task to:

```json
"test": "deno test --allow-read --allow-write --allow-run=deno,git",
```

Run `deno task test scripts/lib/lint/commits_test.ts`.

Expected: FAIL, because the module `./commits.ts` is not found.

- [ ] **Step 3: Implement `scripts/lib/lint/commits.ts` and
      `scripts/lint-commits.ts`**

```ts
// scripts/lib/lint/commits.ts
// Conventional Commits subject check for `deno task lint-commits`. Allowed types
// come from release-please-config.json so the list has one source.

export interface Commit {
  sha: string;
  subject: string;
}

const HEADER = /^([a-z]+)(\([\w./-]+\))?!?: \S/;
const REVERT = /^Revert ".+"$/;
const MALFORMED = "not `type(scope)!: summary`";

export function allowedTypes(
  config: { "changelog-sections": { type: string }[] },
): string[] {
  return config["changelog-sections"].map((s) => s.type);
}

export function checkSubject(
  subject: string,
  types: readonly string[],
): string | null {
  if (REVERT.test(subject)) return null;
  const match = HEADER.exec(subject);
  if (!match) return MALFORMED;
  if (!types.includes(match[1])) {
    return `unknown type "${match[1]}" (allowed: ${types.join(", ")})`;
  }
  return null;
}

export function lintCommits(
  commits: readonly Commit[],
  types: readonly string[],
): string[] {
  const problems: string[] = [];
  for (const { sha, subject } of commits) {
    const reason = checkSubject(subject, types);
    if (reason) problems.push(`${sha.slice(0, 7)} ${subject}: ${reason}`);
  }
  return problems;
}

export function parseLog(output: string): Commit[] {
  return output.split("\n").filter((line) => line.length > 0).map((line) => {
    const tab = line.indexOf("\t");
    return { sha: line.slice(0, tab), subject: line.slice(tab + 1) };
  });
}

export async function commitsInRange(
  base: string,
  cwd: string,
): Promise<Commit[]> {
  const { code, stdout, stderr } = await new Deno.Command("git", {
    args: ["log", "--no-merges", "--format=%H%x09%s", `${base}..HEAD`],
    cwd,
  }).output();
  if (code !== 0) {
    const detail = new TextDecoder().decode(stderr).trim();
    throw new Error(`git log ${base}..HEAD failed: ${detail}`);
  }
  return parseLog(new TextDecoder().decode(stdout));
}
```

```ts
// scripts/lint-commits.ts
import { fromFileUrl } from "@std/path";
import {
  allowedTypes,
  type Commit,
  commitsInRange,
  lintCommits,
} from "./lib/lint/commits.ts";

const ROOT = fromFileUrl(new URL("../", import.meta.url));

async function main() {
  const base = Deno.args[0];
  if (!base) {
    console.error("usage: lint-commits <base-ref>   (e.g. origin/main)");
    Deno.exit(2);
  }
  const config = JSON.parse(
    await Deno.readTextFile(`${ROOT}release-please-config.json`),
  );
  let commits: Commit[];
  try {
    commits = await commitsInRange(base, ROOT);
  } catch (e) {
    console.error(`lint-commits: ${(e as Error).message}`);
    Deno.exit(2);
  }
  const problems = lintCommits(commits, allowedTypes(config));
  for (const line of problems) console.error(line);
  console.log(
    `lint-commits: ${commits.length} commit(s) checked against ${base}, ${problems.length} problem(s)`,
  );
  Deno.exit(problems.length > 0 ? 1 : 0);
}

await main();
```

- [ ] **Step 4: Run the tests (expect PASS)**

Run `deno task test scripts/lib/lint/commits_test.ts`. Expected: 8 passed.

- [ ] **Step 5: Add the tasks and add the script to the typecheck**

In `deno.json` `tasks`, add the following after `lint-skills`:

```json
"lint-commits": "deno run --allow-read=. --allow-run=git scripts/lint-commits.ts",
```

Then add `scripts/lint-commits.ts` to the `typecheck` task's file list, after
`scripts/lint-skills.ts`.

In `mise.toml`, add this block after `[tasks.lint-skills]`:

```toml
# Not part of the release gate: needs a base ref (e.g. `mise run lint-commits -- origin/main`).
[tasks.lint-commits]
description = "Check commit subjects since <base> are Conventional Commits"
run = "deno task lint-commits"
```

Run `mise run lint-commits -- origin/main`.

Expected: exit 0, with a summary like
`lint-commits: N commit(s) checked against
origin/main, 0 problem(s)`. Then
check that the task fails when it should:

```bash
git commit --allow-empty -qm "update stuff" && mise run lint-commits -- origin/main; echo "exit=$?"; git reset -q --soft HEAD~1
```

Expected: a line ending in `update stuff: not \`type(scope)!:
summary\``and`exit=1`. The reset removes the throwaway commit.

- [ ] **Step 6: Wire it into CI**

In `.github/workflows/ci.yml`, inside the `release-gate` job, give the checkout
step `with: { fetch-depth: 0 }`, keeping the pinned `uses:` line unchanged. Then
add this step after `Release gate`:

```yaml
- uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
  with:
    fetch-depth: 0
- uses: jdx/mise-action@2d8d4cafcbd33be2ea37d2b6f5ad595363d1f1ca # v5.1.1
- name: Release gate
  run: mise run release
- name: Commit messages
  if: github.event_name == 'pull_request'
  run: mise run lint-commits -- "origin/${{ github.base_ref }}"
```

Run `deno task lint-workflows`. Expected: no findings.

- [ ] **Step 7: Update `RELEASING.md` and `README.md`**

In `RELEASING.md`, in "How it works", step 1, append this sentence:

```markdown
CI checks every PR commit's subject with `mise run lint-commits`; run it locally
as `mise run lint-commits -- origin/main`.
```

In `README.md`:

- Add a row to the "What you get" table after `ci-pipelines`. It must be a
  single table line:
  `| **commits-and-releases** | Your agent writes one Conventional Commit per logical change, marks breaking changes, explains why in the body, and fixes releases by correcting their input instead of hand-editing changelogs, versions, or tags. Shipping stays your call. |`
- Add `lint-commits` to the "Individual steps" task list, after
  `lint-workflows`.

- [ ] **Step 8: Verify and commit**

Run `deno fmt && mise run release`. Expected: PASS, with the 8 new tests
included.

```bash
git add scripts/lib/lint/commits.ts scripts/lib/lint/commits_test.ts scripts/lint-commits.ts deno.json mise.toml .github/workflows/ci.yml RELEASING.md README.md
git commit -m "ci: check commit subjects against Conventional Commits on PRs"
```

Then run `mise run lint-commits -- origin/main`. Expected: every commit on the
branch passes.

---

### Task 5: Push and open the PR

Confirm with the owner before pushing, because this step is outward-facing.

- [ ] **Step 1:** `git push -u origin feat/commits-and-releases-skill`
- [ ] **Step 2:** Open the PR against `main`:

```bash
gh pr create --base main --head feat/commits-and-releases-skill \
  --title "Add commits-and-releases skill; lint commit subjects in CI" \
  --body-file docs/superpowers/reviews/2026-10-10-commits-and-releases-evals.md
```

Prepend a summary to the body covering:

- the skill
- the cuts and why
- the trigger result
- the new CI step
- the note that commit overrides don't work with this repo's merge commits

Expected: a PR URL, and the PR's `release-gate` run shows the `Commit messages`
step passing.
