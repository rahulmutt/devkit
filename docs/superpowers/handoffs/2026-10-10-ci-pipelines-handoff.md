# Handoff: implement the ci-pipelines skill

**Date:** 2026-10-10 **Next step:** execute the plan with
superpowers:subagent-driven-development.

## Start here

1. `git switch feat/ci-pipelines-skill` (local only, not pushed; stacked on
   `chore/toolchain-and-skill-triggering`).
2. Read the spec, then the plan. Both are approved by the owner; don't
   re-brainstorm or re-litigate decisions:
   - Spec: `docs/superpowers/specs/2026-10-10-ci-pipelines-design.md`
   - Plan: `docs/superpowers/plans/2026-10-10-ci-pipelines-skill.md` (5 tasks)
3. Invoke superpowers:subagent-driven-development and run Tasks 1–5 in order.
   Tasks 1–2 are sequential by design: the RED baseline decides what Task 2
   writes.

## State of the world

| Item                                         | State                                                                                                                                                                                                                        |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR #2 `chore/toolchain-and-skill-triggering` | Open. 6 commits (lint fix, deno 2.9.7 / node 26.11.1, CI actions v7/v5/v5, mise tasks, trigger-only descriptions + generated primer index + content refinements, trigger evals). CI `release-gate`: **SUCCESS**. Not merged. |
| `feat/ci-pipelines-skill`                    | Local only. On top of PR #2: `84941df` spec, `495261d` plan. Clean tree.                                                                                                                                                     |
| Owner action pending                         | Install the Renovate GitHub App on `rahulmutt/devkit` (needed after Task 4 adds `renovate.json`).                                                                                                                            |
| Approved eval budget                         | About $25 for behaviour evals, about $8 for triggers; `--max-cost-usd 15` per run.                                                                                                                                           |
| GitHub auth                                  | `gh` and git push work (the owner fixed auth this session).                                                                                                                                                                  |

If PR #2 merges before Task 5, rebase `feat/ci-pipelines-skill` onto `main` and
open the PR against `main` instead of the PR #2 branch.

## Decisions already made (from brainstorming)

- Scope: pipeline **mechanics only**. Testing tiers stay in `testing-practices`,
  scanners in `security-practices`.
- Platform-agnostic SKILL.md plus `references/github-actions.md` only.
- Every action is pinned by **commit SHA + version comment**, first-party
  included.
- Updater: the skill names Renovate (preferred with mise) and Dependabot; this
  repo uses **Renovate** (verified: the `mise` manager handles `mise.toml`
  deno/node; `helpers:pinGitHubActionDigests` exists).
- Principle 7, added at the owner's request: nightlies run in **smoke mode on
  every PR**, workflows are linted, scheduled failures are loud.
- No nightly gets added to devkit itself (nightly trigger evals would need an
  API-key secret and nightly spend).
- The PR #2 description rewrite stays (owner said "keep").

## Gotchas learned this session

- **`claude plugin eval` nudges:** don't add `append_system_prompt` telling the
  model to "load skills". It made the first baseline 100% and meaningless.
- **Trigger evals saturate in isolation:** devkit alone fired 60/60 both before
  and after the description rewrite. Only with superpowers loaded did it
  separate (58/60 → 60/60). To repeat that, the eval only loads plugins **inside
  the target dir**: copy the plugin under it (e.g. `_competitors/superpowers`)
  in a scratch copy and set
  `plugins: ["../..", "../../_competitors/superpowers"]`. Never commit that.
- **Traces are deleted after a run** unless you pass `--keep-temp`.
- **Run errors from `max_turns`** don't fail a `tool_used` grader that already
  matched, but they add noise. The trigger cases now use `max_turns: 6`.
- **Generator + fmt:** the primer's generated index is piped through `deno fmt`
  (`scripts/lib/render-primer.ts`), so generate/check/test/ validate-manifests
  need `--allow-run=deno`. Never hand-edit the region between
  `<!-- BEGIN/END GENERATED: skill index -->`; run `deno task generate`.
- **mise passes extra args through:** `mise run eval-triggers -- --json x.json`
  reaches `claude plugin eval`.
- **Checking each commit:** use a temporary `git worktree` with `node_modules`
  symlinked, and capture `rc=$?` immediately after `mise run release`. An
  earlier loop read the wrong `$?` and reported false passes.
- **Lint gate on `main`** was red before this work (`no-import-prefix`). PR #2
  fixes it in its first commit.
- **Eval results** go to `evals/results/` (gitignored).

## Done when

- The plan's 5 tasks are checked off and `mise run release` passes on every
  commit.
- `docs/superpowers/reviews/2026-10-10-ci-pipelines-evals.md` has the RED and
  GREEN tables and the cut decisions.
- A stacked PR is open, and its body reminds the owner to install the Renovate
  app.
