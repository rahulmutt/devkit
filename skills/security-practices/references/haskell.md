# Haskell security tooling

| Role             | Tool                                 | Idiom                                                    |
| ---------------- | ------------------------------------ | -------------------------------------------------------- |
| Dependency / SCA | osv-scanner (or cabal-audit)         | scan `cabal.project.freeze` against the OSV advisory DB  |
| SAST             | hlint + the type system              | `hlint` for hygiene; the type system carries most safety |

**Emphasis:** mature OSS SAST for Haskell is thin — be honest about that rather
than overstate coverage. Lean on the type system, parse-don't-validate at
boundaries, and `Safe` / `Trustworthy` Haskell where it applies. Dependency
scanning is still worth wiring in.

To install any of these → use the **developer-environment** skill.
