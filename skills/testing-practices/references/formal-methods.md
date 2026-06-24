# Formal methods & specifications

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

## Aligning a spec with the implementation

- **Model-based testing is the bridge:** derive tests from the model and check
  that the implementation conforms.
- **Refinement** is the formal version of the same idea: prove the
  implementation refines the spec.
- Keep the spec in sync as the code evolves — a stale spec gives false
  confidence.
