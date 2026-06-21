# generated-nextjs Agent Instructions

This repository uses Recall OS repository memory.

Start with durable source-of-truth docs under `docs/`.

Required reading:

- `docs/00-product/PRD.md`
- `docs/10-architecture/ARCHITECTURE.md`
- `docs/20-security/SECURITY_MODEL.md`
- `docs/50-quality/QUALITY_GATES.md`
- `docs/60-engineering/ENGINEERING_STANDARDS.md`

Repository rules override model preferences. If instructions conflict, stop and report the conflict.

## Recall OS commands

This repository is maintained with the Recall OS CLI. Use these commands yourself as you work — do
not ask the human to run them, and do not search the web for them (this is a project-local tool):

- `recall doctor` — validate repository memory; run it before claiming any work is complete.
- `recall feature create <name>` — scaffold feature memory before non-trivial feature work.
- `recall adr create <title>` — propose a decision; `recall adr accept <name>` accepts it.
- `recall adr supersede <old> <new-title>` — record a changed decision (never overwrite an accepted
  ADR).
- `recall module create <name>` — scaffold module memory for a new responsibility boundary.
- `recall mcp add <server>` — capture an MCP tool's context into memory, offline.

Full command reference: `docs/ai/RECALL_COMMANDS.md`.

## Changing an accepted decision

Before changing anything an accepted ADR governs (framework, database, auth, API shape, and
similar):

1. Check `docs/adrs/` for an accepted ADR that covers it.
2. If your change contradicts one, stop and confirm with a human first — do not silently change the
   code and leave the ADR saying the opposite.
3. Record the change as a new decision with `recall adr supersede <old> <new-title>`. That
   supersedes the old ADR instead of overwriting history, so the reasoning stays auditable.

Repository memory is only trustworthy if decisions change through this trail, not silently.
