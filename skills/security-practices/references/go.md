# Go security tooling

| Role                  | Tool        | Idiom                                                           |
| --------------------- | ----------- | --------------------------------------------------------------- |
| Dependency / SCA      | govulncheck | `govulncheck ./...` — reports only CVEs on reachable code paths |
| SAST                  | gosec       | `gosec ./...`; fail CI on findings                              |
| SAST (cross-language) | Semgrep     | `semgrep --config p/golang`                                     |

**Emphasis:** govulncheck's reachability analysis cuts false positives — prefer
it over a raw advisory match. Watch `os/exec`, `html/template` vs
`text/template` for injection, and unchecked error returns.

To install any of these → use the **developer-environment** skill.
