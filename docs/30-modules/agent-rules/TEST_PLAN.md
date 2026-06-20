# Agent Rules Test Plan

## Review Checks

- Root agent docs route to `docs/60-engineering/`.
- Agent rules require stopping on conflicts with repository memory.
- Agent rules prohibit committing secrets, bypassing auth, adding dependencies without review, skipping tests without reason, and claiming completion without evidence.
