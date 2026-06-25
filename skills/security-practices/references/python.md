# Python security tooling

| Role                  | Tool                       | Idiom                                                       |
| --------------------- | -------------------------- | ----------------------------------------------------------- |
| Dependency / SCA      | pip-audit (or osv-scanner) | `pip-audit` against the locked environment; fail CI on CVEs |
| SAST                  | Bandit                     | `bandit -r src/`; allow `# nosec` only with justification   |
| SAST (cross-language) | Semgrep                    | `semgrep --config p/python`                                 |

**Emphasis:** watch the dynamic-language sinks — `pickle` / `yaml.load`,
`subprocess` with `shell=True`, and string-built SQL. Bandit flags these; pair
with parameterized queries and `yaml.safe_load`.

To install any of these → use the **developer-environment** skill.
