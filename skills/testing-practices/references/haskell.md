# Haskell testing

| Role | Library | Idiom |
|------|---------|-------|
| Warnings | GHC | build with `-Wall -Werror` |
| Typecheck | the compiler | the type system already does the heavy lifting |
| Unit / integration | hspec or tasty | `describe`/`it` (hspec); `testGroup` (tasty) |
| Property-based | QuickCheck or hedgehog | `property $ \x -> ...` |
| Model-based | hedgehog (or quickcheck-state-machine) | state-machine commands |
| Fuzz | hedgehog/QuickCheck byte generators | no mature coverage-guided fuzzer; generate bytes as a property |
| Mutation | mucheck | research-grade; expect limited tooling maturity |
| Golden / snapshot | tasty-golden | `goldenVsString` / `goldenVsFile` |

**Lint & format:** owned by the `writing-clean-code` skill — see its
`references/haskell.md` for the canonical formatter + linter (ormolu/fourmolu +
hlint); treat them as the static-validation base of the pyramid here.

**Emphasis:** the compiler and an exhaustive type model catch most defect classes statically — concentrate runtime testing on properties and stateful models.

**Integration deps:** do **not** reach for Docker. Provision Postgres/Redis via `devenv.nix` and connect with `postgresql-simple` / `hasql`.

To install any of these → use the **developer-environment** skill.
