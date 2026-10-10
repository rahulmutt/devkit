---
max_turns: 6
runs: 3
tags: [trigger, security-practices]
allowed_tools: [Read, Glob, Grep, Skill]
---

Add an HTTP endpoint that receives Stripe webhook events and marks orders as
paid.
