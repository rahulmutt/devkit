# Rust style

| Concern | Choice | Idiom |
|---------|--------|-------|
| Style guide | Rust API Guidelines + Rust Style Guide | Applied via formatter + clippy |
| Format | rustfmt | `cargo fmt --check` |
| Lint | clippy | `cargo clippy -- -D warnings` |

**Idioms not auto-enforced:**
- Newtypes for domain values (e.g. `struct UserId(u64)`).
- `Result` + `?` over panics in library code.
- Modules mirror domain boundaries.
- Conversions via `From`/`TryFrom`; construction via builders where it clarifies intent.

To install any of these → use the **developer-environment** skill.
