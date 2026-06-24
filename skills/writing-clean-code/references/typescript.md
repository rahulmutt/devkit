# TypeScript style

| Concern | Choice | Idiom |
|---------|--------|-------|
| Style guide | No single dominant guide — formatter + linter config is the source of truth | Pair with `tsc --strict` |
| Format | Prettier | `prettier --check` |
| Lint | ESLint | `eslint .` (typed lint rules where available) |

**Idioms not auto-enforced:**
- Prefer discriminated unions over boolean flags.
- Avoid `any`; reach for `unknown` + narrowing instead.
- Model domain values as branded/opaque types rather than bare `string`/`number`.
- Keep module boundaries explicit and use barrel `index.ts` files sparingly.

To install any of these → use the **developer-environment** skill.
