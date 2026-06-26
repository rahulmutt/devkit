# Writing Clean Code Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three principles (small modular units, small isolated files, every line is a liability) to the `writing-clean-code` skill and tighten the existing "Optimize for the next reader" principle so nothing is redundant.

**Architecture:** A single Markdown file edit to `skills/writing-clean-code/SKILL.md`, confined to the `## Principles — each with its counter-pull` section. Each new principle follows the skill's house style: a heading, a body naming the failure it prevents, and a `Counter-pull:` clause naming the over-application it guards against.

**Tech Stack:** Markdown. No build, no tests — verification is a content/consistency read.

## Global Constraints

- House style: every principle has a `Counter-pull:` clause. Copy this format verbatim.
- No new principle may duplicate another; tighten existing prose rather than repeat it.
- Changes confined to the `## Principles — each with its counter-pull` section. No reference files, no frontmatter changes.
- Principle wording is fixed by the approved spec — use it verbatim (below).

---

### Task 1: Add three principles and tighten "Optimize for the next reader"

**Files:**
- Modify: `skills/writing-clean-code/SKILL.md` (principles section, lines ~32–52)

**Interfaces:**
- Consumes: nothing (first and only task).
- Produces: nothing downstream (terminal task).

- [ ] **Step 1: Tighten the existing "Optimize for the next reader" principle**

The small-files message and the "open ten files" counter-pull move out of this principle (they relocate to the new file principle in Step 3). Replace the current body:

Find (`skills/writing-clean-code/SKILL.md`, the "Optimize for the next reader" body):

```markdown
### Optimize for the next reader (human or agent)

Locality of behavior, explicit over clever, small focused files that fit in a
context window, names that make comments redundant. Counter-pull: don't fragment
so far that following one behavior means opening ten files.
```

Replace with:

```markdown
### Optimize for the next reader (human or agent)

Locality of behavior, explicit over clever, names that make comments redundant.
Counter-pull: don't chase brevity at the cost of legibility — a terse line the
next reader must decode is not optimizing for them.
```

- [ ] **Step 2: Add the "Prefer small, modular units" principle**

Insert immediately after the "One purpose per unit" principle (before "Domain-driven design"):

```markdown
### Prefer small, modular units

Compose behavior from many small, independently replaceable units rather than a
few large coupled ones — a unit you can understand, test, and swap without
holding the rest in your head. Counter-pull: don't shatter one coherent behavior
into a dozen trivial units that only ever change together — premature
decomposition couples through indirection what was clear inline.
```

- [ ] **Step 3: Add the "Prefer small, isolated files" principle**

Insert immediately after the "Optimize for the next reader" principle (it inherits the small-files message removed in Step 1), as the last principle in the section:

```markdown
### Prefer small, isolated files

One unit per file; keep files small enough to hold in a context window, and
isolated enough that one file's internals aren't entangled with another's.
Counter-pull: don't fragment so far that following one behavior means opening ten
files — locality matters as much as size.
```

- [ ] **Step 4: Add the "Every line is a liability" principle**

Insert immediately after "Prefer small, isolated files", as the new final principle in the section:

```markdown
### Every line is a liability

Every line added is a line to read, test, and maintain — the cheapest code is
the code you don't write, so reach for the simplest thing that works (YAGNI).
When code is reachable from no code path and you are _absolutely sure_, delete
it; dead code misleads the next reader. Counter-pull: "unused" is easy to get
wrong — check for reflection, dynamic dispatch, public API surface, feature
flags, and external callers before deleting. When unsure, leave it and flag it.
```

- [ ] **Step 5: Verify content and consistency**

Run: `grep -n '^### ' skills/writing-clean-code/SKILL.md`

Expected: the principle headings now include, in order:
`Abstract real duplication...`, `Inline the single-use...`, `One purpose per unit`, `Prefer small, modular units`, `Domain-driven design`, `Explicit boundaries and dependency direction`, `Optimize for the next reader (human or agent)`, `Prefer small, isolated files`, `Every line is a liability`.

Run: `grep -c 'Counter-pull' skills/writing-clean-code/SKILL.md`

Expected: count increased by 3 (one per new principle) relative to before — every new principle carries a counter-pull.

Run: `grep -n 'small focused files that fit in a context window' skills/writing-clean-code/SKILL.md`

Expected: no match (the phrase relocated to "Prefer small, isolated files", which uses "small enough to hold in a context window" instead — confirms no duplication).

- [ ] **Step 6: Commit**

```bash
git add skills/writing-clean-code/SKILL.md
git commit -m "feat(writing-clean-code): add modularity, small-files, and code-as-liability principles"
```

---

## Self-Review

**1. Spec coverage:**
- Spec change 1 (small, modular units) → Task 1 Step 2. ✓
- Spec change 2 (small, isolated files) → Task 1 Step 3. ✓
- Spec change 3 (every line is a liability + dead-code removal) → Task 1 Step 4. ✓
- Spec change 4 (tighten "Optimize for the next reader") → Task 1 Step 1. ✓
- Spec out-of-scope (no reference/frontmatter changes) → respected; Global Constraints forbid them. ✓

**2. Placeholder scan:** No TBD/TODO; every step shows the exact Markdown to insert and exact verification commands with expected output. ✓

**3. Type consistency:** N/A for prose. Heading names in Step 5's verification match the headings inserted in Steps 1–4 exactly. ✓
