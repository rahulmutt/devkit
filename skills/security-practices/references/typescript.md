# TypeScript / JavaScript security tooling

| Role              | Tool                         | Idiom                                                                      |
| ----------------- | ---------------------------- | -------------------------------------------------------------------------- |
| Dependency / SCA  | osv-scanner (or `npm audit`) | `osv-scanner --lockfile=package-lock.json`; fail CI on known CVEs          |
| SAST              | Semgrep                      | `semgrep --config p/javascript --config p/typescript`; fail on findings    |
| SAST (lint-level) | eslint security rules        | `eslint-plugin-security` / `eslint-plugin-no-unsanitized` in the lint pass |

**Emphasis:** most JS/TS vulns enter through dependencies and unsanitized sink
usage (DOM XSS, `eval`, `child_process`) — lean on SCA plus the no-unsanitized
eslint rules first.

To install any of these → use the **developer-environment** skill.
