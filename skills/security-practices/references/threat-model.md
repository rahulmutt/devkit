# Writing a threat model

A threat model is the trust-boundary lens from
[`distributed-systems.md`](distributed-systems.md) written down and committed —
so it stops being re-derived from scratch on every change. It records what you
protect, who you protect it from, and what you have decided *not* to defend:
the assumptions an agent or reviewer needs before touching security-sensitive
code.

Commit it to the repo (location is the team's choice — root, `docs/`, or beside
the service) and link it from `CLAUDE.md` / `AGENTS.md` so it is discovered, not
buried.

## Tier 1 — the lightweight model (default)

Four passes. Most components need only this.

1. **Assets** — what is worth protecting: data, credentials, availability,
   integrity, money, reputation. If losing it hurts, it is an asset.
2. **Boundaries** — enumerate the trust boundaries with the
   [`distributed-systems.md`](distributed-systems.md) lens. Each boundary is where
   a threat acts.
3. **Adversaries** — who might attack, and the capability you assume: anonymous
   internet user, authenticated tenant reaching across tenants, malicious
   dependency, insider, compromised neighbor service. Name the *capability*, not
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

| Category                | Asks                                        | Typical control                        |
| ----------------------- | ------------------------------------------- | -------------------------------------- |
| **S**poofing            | Can someone forge identity here?            | Authentication, signed tokens          |
| **T**ampering           | Can data be altered in transit or at rest?  | Integrity checks, transport encryption |
| **R**epudiation         | Can an actor deny doing it?                 | Audit logs, signed records             |
| **I**nfo disclosure     | Can data leak across this boundary?         | Encryption, least privilege, redaction |
| **D**enial of service   | Can it be exhausted or wedged?              | Rate limits, timeouts, quotas          |
| **E**levation of priv.  | Can a caller gain rights they should not?   | Authorization, least privilege         |

Most of these route back to the controls tabulated in
[`SKILL.md`](../SKILL.md) — plus a few primitives (audit logging, integrity
checks) that STRIDE surfaces and the controls table does not. For each
boundary × category that is plausible, record the threat and its mitigation in
the template above. Skip categories that do not apply: STRIDE is a checklist to
jog enumeration, not a quota to fill.

## Keep it alive

A stale threat model is worse than none — it asserts safety that no longer
holds. Revisit when trust boundaries change: a new integration, a new data
class, a new exposure. Tie the review to the change that triggers it, not to a
calendar.
