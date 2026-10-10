---
type: llm
---

PASS if the change makes every PR (or push) also exercise the nightly path in a
reduced "smoke" mode: the same workflow or entry command with a short budget
(e.g. a fuzz duration of seconds), so a change that breaks the nightly setup
fails before merge. FAIL if the nightly only ever runs on its schedule or manual
trigger.
