# Writing Clean Code — Update: modularity, small isolated files, code-as-liability

## Goal

Extend the `writing-clean-code` skill with three principles the current
`SKILL.md` does not yet cover (or covers only incidentally):

1. **Modularity** — compose behavior from many small, independently replaceable
   units rather than a few large coupled ones.
2. **Small, isolated files** — one unit per file, small enough to hold in a
   context window, isolated enough that files aren't entangled.
3. **Code is a liability** — every line added has a maintenance cost; keep it
   simple (YAGNI), and remove dead code once you are absolutely sure it is
   unreachable.

## Constraints

- The skill's house style is **principles, each with its counter-pull**: every
  principle names both the failure it prevents and the over-application it
  guards against. All additions follow this format.
- The skill is itself an argument against bloat, so additions must not be
  redundant with existing principles. Where new content overlaps an existing
  principle, tighten the existing one rather than duplicate.
- Changes are confined to the `## Principles — each with its counter-pull`
  section of `skills/writing-clean-code/SKILL.md`. No reference files change.

## Existing principles (for overlap reconciliation)

- **One purpose per unit** — single reason to change (cohesion). *Distinct from
  new modularity principle, which is about decomposition granularity.*
- **Explicit boundaries and dependency direction** — narrow interfaces,
  dependencies point inward. *Distinct from new modularity principle, which is
  about composability, not interface shape.*
- **Optimize for the next reader** — currently carries the line "small focused
  files that fit in a context window" and the "don't fragment so far that
  following one behavior means opening ten files" counter-pull. *Both move to
  the new "small, isolated files" principle; this principle is tightened to
  avoid duplication.*

## Changes

### 1. New principle — "Prefer small, modular units"

> Compose behavior from many small, independently replaceable units rather than
> a few large coupled ones — a unit you can understand, test, and swap without
> holding the rest in your head. Counter-pull: don't shatter one coherent
> behavior into a dozen trivial units that only ever change together —
> premature decomposition couples through indirection what was clear inline.

### 2. New principle — "Prefer small, isolated files"

> One unit per file; keep files small enough to hold in a context window, and
> isolated enough that one file's internals aren't entangled with another's.
> Counter-pull: don't fragment so far that following one behavior means opening
> ten files — locality matters as much as size.

### 3. New principle — "Every line is a liability"

> Every line added is a line to read, test, and maintain — the cheapest code is
> the code you don't write, so reach for the simplest thing that works (YAGNI).
> When code is reachable from no code path and you are *absolutely sure*, delete
> it; dead code misleads the next reader. Counter-pull: "unused" is easy to get
> wrong — check for reflection, dynamic dispatch, public API surface, feature
> flags, and external callers before deleting. When unsure, leave it and flag
> it.

### 4. Tighten existing "Optimize for the next reader"

Remove the now-relocated "small focused files that fit in a context window"
phrasing and the "don't fragment / open ten files" counter-pull, so the
principle reads cleanly about legibility (locality of behavior, explicit over
clever, self-documenting names) without duplicating the new file principle.

## Out of scope

- No changes to per-language reference files.
- No changes to the `description` frontmatter unless the new principles make it
  inaccurate (they do not — it already says "draw module boundaries").

## Success criteria

- `SKILL.md` contains the three new principles, each with a counter-pull, in the
  principles section.
- "Optimize for the next reader" no longer duplicates the small-files message.
- No principle is redundant with another; the skill stays concise.
