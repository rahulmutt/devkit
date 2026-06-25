# Security in distributed systems — the design lens

The portable mental model behind `security-practices`. Read it when designing or
changing anything that crosses a process or network boundary.

## Enumerate the trust boundaries

A distributed system is a graph of boundaries. Name each one — each is a place
to authenticate, authorize, and validate:

- client ↔ service
- service ↔ service
- service ↔ datastore
- service ↔ queue / event bus
- application ↔ dependency (the supply chain)

For every boundary ask: _what crosses it, who controls the other side, and what
happens if they are hostile?_

## Assume a hostile, partially-failed network

Every call can be intercepted, replayed, dropped, delayed, or reordered.

- Encrypt in transit (TLS; mTLS for service↔service).
- Make non-idempotent operations safe to retry with idempotency keys.
- Set timeouts and fail closed, not open.
- **Network location is not identity** — being "inside the perimeter" proves
  nothing. Authenticate the caller every time.

## Identity and least privilege

- Each service gets its own scoped identity and credentials — no shared
  god-tokens.
- Grant the narrowest permission that still works; widen only on demand.
- Prefer short-lived, rotatable credentials over long-lived static ones.

## Secrets

- Never in code, images, logs, or error messages.
- Injected at runtime (env / secret store), never committed.
- This is where the design rule and **secret scanning** meet: the scanner is the
  backstop for the rule.

## Supply chain

Dependencies are an untrusted boundary you cross on every build.

- **Pin** versions for reproducibility (delegated to `developer-environment`).
- **Scan** dependencies for known CVEs (SCA).
- Prefer fewer, well-maintained, audited dependencies; each one is attack
  surface.
- Keep SBOM awareness — know what you ship.

## Defense in depth

No single control is load-bearing. Validate at each layer, assume any one
control can fail, and make the next layer catch it. When in doubt, fail closed.

Tooling install for any of the above → use the **developer-environment** skill.
