# Python style

| Concern | Choice | Idiom |
|---------|--------|-------|
| Style guide | PEP 8 (with PEP 257 for docstrings) | Applied via formatter + typechecker |
| Format | ruff formatter | `ruff format --check` |
| Lint | ruff + strict typechecker | `ruff check`; pair with `mypy`/`pyright` |

**Idioms not auto-enforced:**
- Use `@dataclass`/`frozen` for value objects.
- Raise explicit exceptions over sentinel return values.
- `snake_case` for functions, `PascalCase` for classes.
- Define module boundaries with `__all__` and keep the public surface small.

To install any of these → use the **developer-environment** skill.
