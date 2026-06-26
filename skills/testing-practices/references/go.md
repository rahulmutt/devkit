# Go testing

| Role | Library | Idiom |
|------|---------|-------|
| Unit / integration | built-in `testing` | `func TestX(t *testing.T)`; build tags for integration |
| Property-based | rapid (default) | `rapid.Check(t, func(t *rapid.T){...})` |
| Model-based | rapid state machine | `rapid.Run` with a state machine |
| Fuzz | built-in fuzzing | `func FuzzX(f *testing.F)` (`go test -fuzz`) |
| Mutation | go-mutesting | audit assertion strength |
| Golden / snapshot | goldie (or autogold) | golden files; `-update` to regenerate |
| Simulation / DST | testing/synctest | stdlib fake-clock bubble (stable in Go 1.25) |
| UI | Playwright-go (or chromedp) | drive a real browser |

**Vet, lint & format:** owned by the `writing-clean-code` skill — see its
`references/go.md` for the canonical `gofmt` + `staticcheck` (with `go vet`);
treat them as the static-validation base of the pyramid here.

**Property choice:** default to **rapid** — native `go test` integration, automatic shrinking, minimal boilerplate. Use **gopter** instead when you need its richer generator/command combinators or its explicit state-machine API.

**DST / hypervisor:** Go has an Antithesis SDK; see `formal-methods.md`.

**Integration deps:** do **not** use `dockertest` or `testcontainers-go`. Provision Postgres/Redis via `devenv.nix` and connect with `pgx`.

To install any of these → use the **developer-environment** skill.
