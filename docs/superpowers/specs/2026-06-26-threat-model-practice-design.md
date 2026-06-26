# Threat-model practice for `security-practices` — design

## Problem

The `security-practices` skill teaches a trust-boundary threat _lens_ —
enumerate boundaries, ask "what happens if the other side is hostile," match a
control. But that reasoning is **ephemeral**: it happens in the moment during
design and then evaporates. Nothing in the skill instructs the developer to
write the result down, commit it, or make it discoverable.

The consequence: every agent and contributor re-derives what the system is
protecting and against whom — usually incompletely. The skill's own description
promises a "threat lens" but never produces a durable threat _model artifact_
that records assets, adversaries, and explicitly out-of-scope assumptions. The
design spec and plan never considered this, so it is an unaddressed gap, not a
deliberate omission.

## Goal

Add to `security-practices`:

1. The practice of **committing a threat model** to the repo so it is durable
   and discoverable (including by AI agents).
2. **Guidelines for creating the threat model itself** — a method and a
   template.

## Non-goals

- Prescribing a fixed filename or location. Teams place the artifact where their
  docs live; the skill stays location-agnostic (with a soft nudge to link it
  from `CLAUDE.md` / `AGENTS.md` for discoverability).
- Mandating a heavyweight formal methodology for every component. STRIDE is
  offered as an optional second tier, not the default spine.
- Re-teaching boundary enumeration — that already lives in
  `references/distributed-systems.md` and is reused, not duplicated.

## Design

### Structure

Mirror the skill's existing split between an actionable index (`SKILL.md`) and a
reasoning reference (`references/distributed-systems.md`):

- A short, actionable section in `SKILL.md` (the what / when / where).
- A new `references/threat-model.md` carrying the full how-to: method, template,
  STRIDE deepening, maintenance.

### `SKILL.md` — new section `## Commit a threat model`

Placed after the opening lens paragraph and before `## Controls` — the threat
model is the _what/whom_ that the controls (_how_) serve. Roughly two short
paragraphs:

- A threat model is the boundary lens written down and committed, so agents and
  contributors stop re-deriving what is defended and against whom. Commit the
  artifact: assets, adversaries, boundaries that matter, what is explicitly out
  of scope.
- Write one when a component handles untrusted input, secrets, or
  cross-trust-boundary traffic; revisit when those boundaries change. Keep it in
  the repo (location is the team's choice) and point to it from `CLAUDE.md` /
  `AGENTS.md` so agents load it before touching security-sensitive code. Pointer
  to `references/threat-model.md` for the full method.

Add one entry to the `## References` list pointing at the new file.

### `references/threat-model.md` (new)

- **Intro:** a threat model is the `distributed-systems.md` lens written down
  and committed; it records what you protect, from whom, and what you have
  decided _not_ to defend. Commit it and link it from `CLAUDE.md` / `AGENTS.md`.

- **Tier 1 — lightweight method (default):** four passes, sufficient for most
  components:
  1. **Assets** — what is worth protecting (data, credentials, availability,
     integrity, money, reputation).
  2. **Boundaries** — enumerate trust boundaries, reusing the
     `distributed-systems` lens.
  3. **Adversaries** — who attacks and the assumed _capability_ (anonymous
     internet user, cross-tenant authenticated caller, malicious dependency,
     insider, compromised neighbor service). Name the capability, not just the
     label.
  4. **Scope** — what is in scope, out of scope, and which risks are knowingly
     accepted. The out-of-scope line is the highest-value part: it stops agents
     from "fixing" non-goals and records a deliberate decision.

- **Template:** a markdown skeleton — Assets / Trust boundaries / Adversaries /
  In scope / Out of scope & accepted risks / Mitigations (threat → control).

- **Tier 2 — STRIDE pass (high-stakes components):** for auth, payments,
  multi-tenant isolation, or anything internet-facing with real consequences,
  walk STRIDE (Spoofing, Tampering, Repudiation, Info disclosure, Denial of
  service, Elevation of privilege) across each boundary. Its mitigations map
  back to the controls already in `SKILL.md`'s Controls table (authentication,
  authorization/least privilege, transport encryption, rate limits, etc.), so
  the two reinforce rather than duplicate. Framed as a checklist to jog
  enumeration, not a quota to fill.

- **Keep it alive:** a stale threat model is worse than none — it asserts safety
  that no longer holds. Revisit when trust boundaries change (new integration,
  new data class, new exposure), tied to the triggering change rather than a
  calendar.

## Consistency

- Reuses `distributed-systems.md` for boundary enumeration instead of restating
  it.
- Tier 2 STRIDE mitigations are the same controls already tabulated in
  `SKILL.md`, keeping a single vocabulary across the skill.
- Matches the skill's existing SKILL.md-index + references-reasoning structure.

## Testing / verification

This is a documentation/skill-content change. Verification is editorial:

- The new SKILL.md section and references file render correctly and links
  resolve.
- The threat-model method is internally consistent with the boundary lens and
  the Controls table (no contradictory vocabulary).
- No placeholders or TODOs remain.
