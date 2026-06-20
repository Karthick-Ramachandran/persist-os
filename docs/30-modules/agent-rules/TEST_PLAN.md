# Agent Rules Test Plan

## Review Checks

- Root agent docs route to `docs/60-engineering/`.
- Agent rules require stopping on conflicts with repository memory.
- Agent rules prohibit committing secrets, bypassing auth, adding dependencies without review, skipping tests without reason, and claiming completion without evidence.
- Root agent docs document Doctor as a completion gate when the CLI binary is available.
- Init-generated command memory documents available SpecForge commands for agents.
