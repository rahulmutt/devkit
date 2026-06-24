# Hexagonal architecture (ports & adapters)

Isolate the domain core from the outside world so it depends on nothing
external. All I/O, frameworks, and infrastructure live at the edges; the
core holds the business logic and knows only about its own types and the
abstract interfaces it defines. This makes the core independently testable,
portable across delivery mechanisms, and insulated from infrastructure churn.

## The pieces

**Domain core** — business logic, domain types, and domain events. Contains
no I/O, no framework imports, and no references to any specific database,
transport, or external service.

**Ports** — interfaces that the core *owns*:
- *Driving (inbound) ports* — what the core offers to the outside world (e.g.
  a `PlaceOrderUseCase` interface).
- *Driven (outbound) ports* — what the core needs from the outside world (e.g.
  an `OrderRepository` interface that the core calls but does not implement).

**Adapters** — concrete implementations at the edges:
- *Driving adapters* call inbound ports: an HTTP handler or CLI command
  receives external input and delegates to the core.
- *Driven adapters* implement outbound ports: a Postgres repository satisfies
  the `OrderRepository` contract the core defined.

## The dependency rule

Adapters depend on the core; the core never depends on adapters. Dependencies
point inward. The core defines the outbound port interface and the adapter
implements it — this is dependency inversion applied at the architecture level.
Reversing this (importing an adapter type into the core) breaks the pattern and
reintroduces tight coupling.

## A small example

```
// Outbound port — defined and owned by the core
interface OrderRepository {
  findById(id: OrderId): Order | null
  save(order: Order): void
}

// Core service — depends only on the port interface
class OrderService {
  constructor(private repo: OrderRepository) {}
  place(order: Order): void {
    order.validate()
    this.repo.save(order)
  }
}

// Driven adapter — implements the port, lives at the edge
class PostgresOrderRepository implements OrderRepository { ... }

// Driving adapter — calls the inbound port, lives at the edge
httpPost("/orders", (req) => orderService.place(req.body))
```

## When it earns its cost

- **Rich domain logic** that would become entangled with persistence or HTTP
  concerns in a layered design.
- **Swappable or churning infrastructure** — replacing the database, adding a
  message-queue consumer, or supporting a new delivery mechanism (CLI, gRPC)
  without touching the core.
- **Multiple delivery mechanisms** — the same core served via HTTP, a CLI, and
  background jobs, each as its own driving adapter.
- **Isolated core tests** — stub or in-memory adapters let you run the full
  business logic suite without real I/O, keeping it fast and deterministic.

## When it is over-engineering

Hexagonal architecture adds indirection, interfaces, and wiring that are only
justified when the domain complexity or infrastructure variability is high enough
to repay that ceremony. Avoid it for:

- **Thin or CRUD domains** — when the "business logic" is mostly reading and
  writing records, the port layer becomes boilerplate with no real payoff.
- **Scripts and one-off tools** — the added structure outlives the script's
  useful life before it pays for itself.
- **Early-stage prototypes** — reach for the simplest structure that can teach
  you what the domain actually is; refactor toward hexagonal later if the
  domain proves rich enough to warrant it.

The guiding question is the same as for any abstraction: does the benefit
exceed the ceremony? Prefer the cheapest structure that keeps the code
understandable and the domain logic testable — add layers only when you feel
the friction of not having them.

To install any tooling → use the **developer-environment** skill.
