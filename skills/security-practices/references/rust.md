# Rust security tooling

| Role              | Tool             | Idiom                                                        |
| ----------------- | ---------------- | ------------------------------------------------------------ |
| Dependency / SCA  | cargo-audit      | `cargo audit` against `Cargo.lock` (RustSec advisory DB)     |
| Dependency policy | cargo-deny       | `cargo deny check advisories bans sources licenses`          |
| SAST              | Semgrep + clippy | `semgrep --config p/rust`; `cargo clippy` for security lints |

**Emphasis:** the type system and ownership model retire whole bug classes
(use-after-free, data races). The residual security surface is mostly `unsafe`
blocks, dependency CVEs, and logic errors — audit `unsafe` and lean on
cargo-audit / cargo-deny.

To install any of these → use the **developer-environment** skill.
