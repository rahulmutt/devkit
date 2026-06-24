# Go style

| Concern | Choice | Idiom |
|---------|--------|-------|
| Style guide | Effective Go + Google Go Style Guide | Applied via formatter + staticcheck |
| Format | gofmt | `gofmt -l .` (or `go fmt ./...`) |
| Lint | staticcheck | `staticcheck ./...` (with `go vet`) |

**Idioms not auto-enforced:**
- Accept interfaces, return structs.
- Define small interfaces at the consumer, not the producer.
- Errors as values with `%w` wrapping.
- One package per responsibility, named for what it provides.

To install any of these → use the **developer-environment** skill.
