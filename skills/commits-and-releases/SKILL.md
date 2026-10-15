---
name: commits-and-releases
description: Use when writing commit messages or splitting work into commits; when cutting, versioning, or tagging a release; when editing a CHANGELOG or bumping a version number; when setting up or fixing release-please, semantic-release, or changesets; or when a release has the wrong version or is missing changelog entries.
---

# Commits and Releases

Commit history is the input to the release: release tooling reads each commit
subject to pick the version bump and write the changelog. So a wrong release is
fixed by changing that input, never the output.

Commit format, breaking-change syntax, type-to-bump mapping, when to ship, and
fixing merged history: see
[`references/release-please.md`](references/release-please.md).

## Releases come from history, not hand edits

Never hand-edit the changelog, bump version strings or the manifest, or create
tags that the release automation owns. That includes the files on the open
release PR's branch: the next run regenerates them and your edit is lost or
contradicts history.

Fix a wrong release by changing what the tool reads:

- **Wrong version:** add a commit on the default branch with a
  `Release-As: X.Y.Z` footer (an empty commit is fine).
- **Mistyped commit, squash-merged PR:** edit the merged PR's body to add a
  commit override (`BEGIN_COMMIT_OVERRIDE` / `END_COMMIT_OVERRIDE` around the
  corrected message). The squash commit maps to that one PR, so the override
  applies.
- **Mistyped commit, plain merge commits:** the override is ignored, because
  release-please can't tell which of the PR's commits it replaces. Add a new
  commit on the default branch whose subject carries the correct type, e.g.
  `git commit --allow-empty -m "feat: add --json output flag"`. Don't rely on
  the override here.

Check which merge strategy the repo uses before choosing between the last two.

Counter-pull: bootstrap steps (the baseline tag, the first `1.0.0`) are
deliberately manual.

## Boundaries with sibling skills

- Release workflow YAML: pinning, token permissions, runners →
  **`ci-pipelines`**.
- Exposing the gate as a named task → **`navigable-codebases`**.
- What the code inside a commit looks like → **`writing-clean-code`**.
- Out of scope: PR size and stacking, review etiquette, deploys.
