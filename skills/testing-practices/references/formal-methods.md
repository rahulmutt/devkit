# Formal methods, specifications & simulation

Pointers, not tutorials. To install any tool below → use the **developer-environment** skill.

## When formal methods earn their cost

Reach for them when the state space is too large to test exhaustively and a
counterexample would be expensive in production:

- Concurrency and distributed protocols (interleavings tests won't find).
- Critical invariants that must never be violated.
- Security properties.

Property-based testing is the gateway: the cheapest way to start thinking in
invariants before committing to a heavyweight spec.

## Tool → problem map

| Tool | Best for |
|------|----------|
| TLA+ / Quint | Protocols & concurrency — model-check temporal properties over all interleavings |
| Lean / Coq / Isabelle | Theorem proving for mathematical / logical correctness |
| Alloy | Structural & relational modeling with bounded checking |
| Dafny / Kani | Code-level verification (Kani for Rust) |

## Fault injection: simulation, real clusters, and chaos

Many of the hardest bugs only surface under faults — partitions, crashes,
latency, clock skew, reordered or dropped messages. Three families inject those
faults. As you move down the list you trade **reproducibility for realism**, and
shift from proving _correctness_ to validating _resilience_. Pick by which you
need.

### Deterministic Simulation Testing (DST) — most reproducible

Run the whole system in one deterministic environment where time, network, disk,
scheduling, and randomness are all driven by a single seed, so
`seed + code version = exact replay`. Heisenbugs become reproducible failures,
and long operation compresses into minutes on one core. Lineage: FoundationDB
(`BUGGIFY`) → TigerBeetle's VOPR.

- **OSS, in-process** (you design the system around deterministic I/O):
  **madsim** and **turmoil** (Rust); Go's **`testing/synctest`** (stdlib, stable
  in 1.25); **shuttle** / **loom** for the concurrency-interleaving sub-case.
- **Hypervisor** (works on most software, proprietary): **Antithesis** runs the
  system in a deterministic hypervisor, autonomously explores state while
  injecting faults, and makes every bug reproducible. Its **SDK** (Go, Rust, C,
  C++, Java, Python, JS, .NET) exposes an assertion taxonomy — `always`,
  `sometimes` (a coverage-superior "this scenario was actually exercised"
  check), and `reachable` / `unreachable` — plus controlled randomness and fault
  injection. Exact symbols vary per SDK; check the per-language docs.

In-process and hypervisor DST are complementary (e.g. Turso runs both).

### Black-box on real clusters — Jepsen

**Jepsen** drives a _real_ distributed cluster under injected faults (its
`nemesis`) and checks the recorded history for consistency violations with the
**Knossos / Elle** checkers. It finds violations in the real system, but a
failure may not reproduce — the trade DST avoids. Use Jepsen to validate the
real system, DST to get deterministic repro.

### Chaos engineering — most realistic

Inject faults into staging or production to validate **resilience and
availability**, not correctness. The discipline: state a steady-state
hypothesis, bound the blast radius, and automate continuously. Tools: Chaos
Monkey / Simian Army, **Chaos Mesh** and **LitmusChaos** (CNCF, Kubernetes),
**AWS FIS**, **Gremlin**, and **Toxiproxy** (network-fault proxy).

### UI front-end — Bombadil

**Bombadil** (`antithesishq/bombadil`) is Antithesis's open-source
property-based testing framework for **web and terminal UIs** (TypeScript spec,
Rust implementation; successor to Quickstrom). It autonomously drives the UI and
checks declared properties after each action; it runs locally or in CI but gets
perfect seed-based replay only inside the Antithesis platform.

DST is the **runnable bridge** between property/model testing and full formal
verification: property-based testing is the gateway to thinking in invariants,
and DST exercises those invariants against a simulated, fault-injecting world.

## Aligning a spec with the implementation

- **Model-based testing is the bridge:** derive tests from the model and check
  that the implementation conforms.
- **Refinement** is the formal version of the same idea: prove the
  implementation refines the spec.
- Keep the spec in sync as the code evolves — a stale spec gives false
  confidence.
