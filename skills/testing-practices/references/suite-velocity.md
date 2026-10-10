# Test suite maintenance & developer velocity

A test suite is a standing liability as well as an asset: it costs wall-clock on
every change and erodes trust when slow or flaky.

**Tier the suite by speed and blast radius:**

- **pre-commit / on-save** — static checks + fast unit tests; sub-second to a
  few seconds; runs constantly and must never block flow.
- **PR / CI (blocking)** — unit + the key integration tests. Hold it to an
  explicit **wall-clock budget**; it gates every merge, so its speed _is_ team
  velocity.
- **nightly / scheduled** — e2e, mutation, fuzz, DST soak runs, chaos
  experiments, full cross-matrix (OS / runtime versions); slow, broad, or
  long-running, and off the merge critical path.

**Move a test to nightly/scheduled** when it is too slow for the PR budget, is
an inherently long-running campaign (fuzz, DST soak, chaos), needs expensive or
rate-limited resources, is a full cross-matrix sweep, or its marginal
bug-catch-per-minute is low.

**Judge each test by value-per-time, and budget by criticality.** A test's worth
is the bugs it catches and the confidence it buys _relative to the wall-clock it
spends on every run_; a slow test that rarely fails meaningfully is a candidate
for nightly or deletion. Allocate the blocking-tier budget in proportion to the
**criticality of the system area each suite guards** — generously where failure
is catastrophic (money movement, auth, data integrity), sparingly on
low-risk/low-churn areas.

**Flakiness is the #1 velocity killer** — an intermittently failing test trains
the team to ignore red, which defeats the suite. Quarantine a flaky test out of
the blocking tier fast, then **fix-or-delete**; never paper over it with blind
retry-to-green. Track flake rate as a health metric.

**Keep the blocking tier fast as the suite grows** via parallelization /
sharding across workers and **test selection** (run only the tests a change
impacts). Mutation and fuzz parallelize naturally across workers and nightly
windows.

This is where the "right altitude" pyramid pays off: a top-heavy suite blows the
blocking-tier budget first.
