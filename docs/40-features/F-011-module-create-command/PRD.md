# PRD: Module Create Command

## Purpose

Implement `specforge module create <name>` so repositories can create module memory before or during implementation work.

P8 makes module ownership, boundaries, tests, and decisions repeatable through the CLI.

## Problem

SpecForge can create repository memory, feature memory, and ADR drafts, but it cannot yet create module memory through the CLI.

Without module-create support, users and agents may skip the durable ownership and boundary docs that help future work avoid drift.

## Decision

P8 adds a module create command that creates concise starter module memory.

P8 creates module memory only. It does not create feature delivery docs automatically.

Teams should use `feature create` separately when planning feature work.

## In Scope

- Module name slugging.
- Module document generation.
- CLI command wiring for `module create <name>`.
- Config-based module directory selection.
- Safe write planning and execution.
- `--dry-run`.
- `--force`.
- Small shared write-summary output helper.
- Unit and integration tests.

## Non-Goals

- Feature folder creation from module create.
- Module dependency graph analysis.
- Doctor command.
- Package `bin` or release wiring.
- Rich templates.
- Network, telemetry, MCP runtime, AI API, cloud behavior, or production app code.

## Success Criteria

- Command requires initialized SpecForge config.
- Command creates `<modulesDir>/<slug>/` module memory.
- Generated module memory includes `MODULE.md`, `TASKS.md`, `TEST_PLAN.md`, and `DECISIONS.md`.
- Unsafe names are rejected.
- Existing files are skipped by default.
- Dry run writes nothing.
- Force overwrites explicitly.
- Existing command output behavior is preserved after write-summary helper extraction.
