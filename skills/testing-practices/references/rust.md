# Rust testing

| Role | Library | Idiom |
|------|---------|-------|
| Lint | clippy | `cargo clippy -- -D warnings` |
| Format | rustfmt | `cargo fmt --check` |
| Typecheck | the compiler | the type system already does the heavy lifting |
| Unit / integration | built-in | `#[test]` in-module; `tests/` dir for integration |
| Property-based | proptest (or quickcheck) | `proptest! { ... }` |
| Model-based | proptest-state-machine | reference-model state machine |
| Fuzz | cargo-fuzz | libFuzzer target with `arbitrary` inputs |
| Mutation | cargo-mutants | `cargo mutants` to audit assertion strength |
| Golden / snapshot | insta | `assert_snapshot!`, redactions, `cargo insta review` |
| Simulation / DST | madsim / turmoil | deterministic async runtime / sim network; `shuttle`/`loom` for interleavings |
| Code-level formal | kani | see formal-methods.md |

**Emphasis:** the compiler and clippy catch most defect classes statically — invest test budget in property and fuzz tests where the type system can't reach (invariants, untrusted input).

**DST / hypervisor:** an Antithesis Rust SDK exists; see `formal-methods.md`.

**Integration deps:** do **not** use `testcontainers-rs`. Provision Postgres/Redis via `devenv.nix` and connect with `sqlx` / `tokio-postgres`.

To install any of these → use the **developer-environment** skill.
