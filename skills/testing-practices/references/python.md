# Python testing

| Role | Library | Idiom |
|------|---------|-------|
| Lint + format | ruff | `ruff check` + `ruff format` |
| Typecheck | mypy or pyright (strict) | `--strict`; ban implicit `Any` |
| Unit / integration | pytest | `def test_x(): assert ...` |
| Property-based | hypothesis | `@given(strategy)` |
| Model-based | hypothesis | `RuleBasedStateMachine` |
| Fuzz | atheris | libFuzzer-based `TestOneInput` harness |
| Mutation | mutmut (or cosmic-ray) | `mutmut run` to audit assertion strength |
| UI | Playwright for Python | `page.goto(...)` / `expect(locator)` |

**Emphasis:** Python is dynamically typed — a strict typechecker (mypy/pyright) is the single highest-leverage layer and recovers guarantees a compiler would give for free. Run it in CI, not just in the editor.

**Integration deps:** do **not** use `pytest-docker` or `testcontainers`. Provision Postgres/Redis via `devenv.nix` and connect with `psycopg` / `redis-py`.

To install any of these → use the **developer-environment** skill.
