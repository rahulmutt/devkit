# TypeScript / JavaScript testing

| Role | Library | Idiom |
|------|---------|-------|
| Typecheck | `tsc --noEmit --strict` | strict mode; ban `any` |
| Unit / integration | vitest (or `node:test`) | `describe` / `it` / `expect` |
| Property-based | fast-check | `fc.assert(fc.property(arb, pred))` |
| Model-based | fast-check commands | `fc.modelRun` with `Command` objects |
| Fuzz | jazzer.js | coverage-guided; `fuzz` entry per target |
| Mutation | Stryker | `stryker run` to audit assertion strength |
| Golden / snapshot | vitest (or jest) snapshots | `toMatchSnapshot` / `toMatchInlineSnapshot` |
| UI | Playwright | `page.goto(...)` / `expect(locator)` |

**Lint & format:** owned by the `writing-clean-code` skill — see its
`references/typescript.md` for the canonical formatter + linter; treat them as
the static-validation base of the pyramid here.

**Emphasis:** JS is dynamically typed — `tsc --strict` is the single highest-leverage validation layer; treat type errors as build failures.

**DST / hypervisor:** no mature in-process DST framework; a JS Antithesis SDK exists, and **Bombadil** drives web/terminal UIs — see `formal-methods.md`.

**Integration deps:** do **not** use `testcontainers`. Provision Postgres/Redis via `devenv.nix` and connect with the plain client (`pg`, `postgres`, `ioredis`).

To install any of these → use the **developer-environment** skill.
