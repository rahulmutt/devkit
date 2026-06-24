# Haskell style

| Concern | Choice | Idiom |
|---------|--------|-------|
| Style guide | Community style (e.g. the Haskell Style Guide); types-first design | Applied via formatter + hlint |
| Format | ormolu or fourmolu | `fourmolu --mode check` |
| Lint | hlint | `hlint .` |

**Idioms not auto-enforced:**
- Make illegal states unrepresentable with precise types.
- Newtypes for domain values.
- Smart constructors that enforce invariants.
- Module export lists as the boundary — export the type, hide the constructor when invariants matter.

To install any of these → use the **developer-environment** skill.
