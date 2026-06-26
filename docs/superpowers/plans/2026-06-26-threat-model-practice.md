# Threat-Model Practice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a committed-threat-model practice and a how-to (method + template)
to the `security-practices` skill.

**Architecture:** Mirror the skill's existing split — an actionable section in
`SKILL.md` (what/when/where) backed by a new `references/threat-model.md`
reasoning file (method, template, STRIDE deepening, maintenance). Reuse the
boundary-enumeration lens from `references/distributed-systems.md` rather than
restating it; map STRIDE mitigations back to the existing Controls table.

**Tech Stack:** Markdown only. No code, no build step. Verification is editorial
(render + link resolution + internal consistency).

## Global Constraints

- Files live under `skills/security-practices/`.
- Location/discoverability of the threat-model artifact stays team-flexible;
  only _nudge_ linking from `CLAUDE.md` / `AGENTS.md`. Do not prescribe a fixed
  path.
- Reuse `references/distributed-systems.md` for boundary enumeration; do not
  duplicate it.
- Tier 2 STRIDE mitigations must use the same control vocabulary already in
  `SKILL.md`'s Controls table (authentication, authorization/least privilege,
  transport encryption, rate limits, secrets, supply chain).
- Match existing prose style: hard-wrapped at ~80 columns, sentence-case
  headings, em-dash usage consistent with the current files.

---

### Task 1: Create `references/threat-model.md`

**Files:**

- Create: `skills/security-practices/references/threat-model.md`

**Interfaces:**

- Consumes: the boundary-enumeration lens defined in
  `references/distributed-systems.md` (linked, not restated).
- Produces: the link target `references/threat-model.md` that Task 2's SKILL.md
  section and References list point to.

- [ ] **Step 1: Create the file with the full content below**

````markdown
# Writing a threat model

A threat model is the trust-boundary lens from
[`distributed-systems.md`](distributed-systems.md) written down and committed —
so it stops being re-derived from scratch on every change. It records what you
protect, who you protect it from, and what you have decided _not_ to defend: the
assumptions an agent or reviewer needs before touching security-sensitive code.

Commit it to the repo (location is the team's choice — root, `docs/`, or beside
the service) and link it from `CLAUDE.md` / `AGENTS.md` so it is discovered, not
buried.

## Tier 1 — the lightweight model (default)

Four passes. Most components need only this.

1. **Assets** — what is worth protecting: data, credentials, availability,
   integrity, money, reputation. If losing it hurts, it is an asset.
2. **Boundaries** — enumerate the trust boundaries with the
   [`distributed-systems`](distributed-systems.md) lens. Each boundary is where
   a threat acts.
3. **Adversaries** — who might attack, and the capability you assume: anonymous
   internet user, authenticated tenant reaching across tenants, malicious
   dependency, insider, compromised neighbor service. Name the _capability_, not
   just the label.
4. **Scope** — state what is **in scope**, what is **out of scope**, and which
   risks you **knowingly accept**. The out-of-scope line is the most valuable:
   it stops agents from "fixing" non-goals and records a deliberate decision.

### Template

```markdown
# Threat model — <component>

## Assets

- <what we protect and why it matters>

## Trust boundaries

- <boundary> — what crosses it, who controls the other side

## Adversaries

- <who> — <assumed capability> — <what they are after>

## In scope

- <threats we defend against>

## Out of scope / accepted risks

- <threat> — <why we accept or defer it>

## Mitigations

- <threat> → <control> (link to the code / config that implements it)
```

## Tier 2 — a STRIDE pass (high-stakes components)

When a component is high-value or exposed — auth, payments, multi-tenant
isolation, anything internet-facing with real consequences — deepen Tier 1 by
walking **STRIDE** across each boundary:

| Category               | Asks                                       | Typical control                        |
| ---------------------- | ------------------------------------------ | -------------------------------------- |
| **S**poofing           | Can someone forge identity here?           | Authentication, signed tokens          |
| **T**ampering          | Can data be altered in transit or at rest? | Integrity checks, transport encryption |
| **R**epudiation        | Can an actor deny doing it?                | Audit logs, signed records             |
| **I**nfo disclosure    | Can data leak across this boundary?        | Encryption, least privilege, redaction |
| **D**enial of service  | Can it be exhausted or wedged?             | Rate limits, timeouts, quotas          |
| **E**levation of priv. | Can a caller gain rights they should not?  | Authorization, least privilege         |

The controls are the same ones tabulated in [`SKILL.md`](../SKILL.md) — STRIDE
just routes each boundary to them. For each boundary × category that is
plausible, record the threat and its mitigation in the template above. Skip
categories that do not apply: STRIDE is a checklist to jog enumeration, not a
quota to fill.

## Keep it alive

A stale threat model is worse than none — it asserts safety that no longer
holds. Revisit when trust boundaries change: a new integration, a new data
class, a new exposure. Tie the review to the change that triggers it, not to a
calendar.
````

- [ ] **Step 2: Verify the file renders and internal links resolve**

Run:

```bash
test -f skills/security-practices/references/threat-model.md && \
grep -q "Tier 1" skills/security-practices/references/threat-model.md && \
grep -q "Tier 2" skills/security-practices/references/threat-model.md && \
test -f skills/security-practices/references/distributed-systems.md && \
test -f skills/security-practices/SKILL.md && \
echo "OK: file present, both tiers present, link targets exist"
```

Expected: prints `OK: file present, both tiers present, link targets exist`

- [ ] **Step 3: Commit**

```bash
git add skills/security-practices/references/threat-model.md
git commit -m "feat(security-practices): add threat-model how-to reference"
```

---

### Task 2: Add the `## Commit a threat model` section and References entry to `SKILL.md`

**Files:**

- Modify: `skills/security-practices/SKILL.md` — insert a new section between
  the opening lens paragraph (ends line ~14) and `## Controls` (line ~16); add
  one bullet to the `## References` list.

**Interfaces:**

- Consumes: `references/threat-model.md` created in Task 1 (link target must
  exist).
- Produces: the user-facing entry point that directs readers to the threat-model
  method.

- [ ] **Step 1: Insert the new section before `## Controls`**

Find this boundary in `SKILL.md`:

```markdown
identity gets the narrowest access that still works.

## Controls — match the boundary to its control
```

Replace it with:

```markdown
identity gets the narrowest access that still works.

## Commit a threat model

The boundary lens above is reasoning you do in the moment; a **threat model** is
that reasoning written down and committed to the repo. Without it, every agent
and contributor re-derives what you are defending and against whom — usually
incompletely. Commit the artifact so the assumptions are durable and
discoverable: the assets you protect, the adversaries you assume, the boundaries
that matter, and what is explicitly out of scope.

Write one when a component handles untrusted input, secrets, or
cross-trust-boundary traffic, and revisit it when those boundaries change. Keep
it in the repo (location is yours) and point to it from `CLAUDE.md` /
`AGENTS.md` so agents load it before touching security-sensitive code. Full
method and template →
[`references/threat-model.md`](references/threat-model.md).

## Controls — match the boundary to its control
```

- [ ] **Step 2: Add a References entry**

Find the `## References` list and add this as the second bullet, right after the
`distributed-systems.md` entry:

```markdown
- [`references/threat-model.md`](references/threat-model.md) — how to write and
  commit a threat model (lightweight method + STRIDE deepening).
```

- [ ] **Step 3: Verify the section and link are present and consistent**

Run:

```bash
grep -q "## Commit a threat model" skills/security-practices/SKILL.md && \
grep -q "references/threat-model.md" skills/security-practices/SKILL.md && \
echo "OK: section and reference link present"
```

Expected: prints `OK: section and reference link present`

- [ ] **Step 4: Confirm the new section sits before Controls**

Run:

```bash
awk '/## Commit a threat model/{c=NR} /## Controls/{ctrl=NR} END{ if (c>0 && c<ctrl) print "OK: threat-model section precedes Controls"; else print "FAIL: ordering wrong" }' skills/security-practices/SKILL.md
```

Expected: prints `OK: threat-model section precedes Controls`

- [ ] **Step 5: Commit**

```bash
git add skills/security-practices/SKILL.md
git commit -m "feat(security-practices): add commit-a-threat-model section"
```

---

## Self-Review

**Spec coverage:**

- "Commit a threat model so agents are aware what you protect against" → Task 2
  SKILL.md section + Task 1 intro (discoverability nudge to
  `CLAUDE.md`/`AGENTS.md`). ✓
- "Guidelines on how to create the threat model itself" → Task 1 Tier 1 method +
  template. ✓
- "Both, layered (lightweight default + STRIDE)" → Task 1 Tier 1 and Tier 2. ✓
- "Location flexible" → Global Constraints + Task 1 intro wording. ✓
- "Section + new reference" structure → Task 1 (reference) + Task 2 (section). ✓
- Maintenance ("keep it alive") → Task 1 final section. ✓

**Placeholder scan:** The `<...>` tokens appear only inside the threat-model
_template_ that ships to end users (intentional fill-in slots), not as plan
placeholders. No "TBD"/"TODO"/"implement later" in plan steps. ✓

**Type/name consistency:** Link target `references/threat-model.md` is identical
in Task 1 (created), Task 2 SKILL.md section, and Task 2 References entry.
Section heading `## Commit a threat model` matches between Task 2 Step 1 and the
Step 3/4 grep checks. STRIDE control vocabulary (authentication,
authorization/least privilege, transport encryption, rate limits) matches the
Controls table referenced in Global Constraints. ✓
