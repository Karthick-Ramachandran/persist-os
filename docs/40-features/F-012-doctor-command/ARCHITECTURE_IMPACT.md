# Architecture Impact: Doctor Command

## Affected Modules

- `cli`
- `commands`
- `core/doctor`
- `core/config`
- `core/generator`
- `doctor`
- `repository-init`
- `agent-rules`

## New Behavior

P9 adds a read-only repository memory health check.

Doctor reads repository files and reports structural health. It does not mutate files.

P9 also updates init generation so repositories get local command-reference memory.

## Module Boundary Check

- `core/doctor` owns health checks, findings, reports, and exit-code mapping.
- `commands/doctor` owns command orchestration.
- `cli` owns command registration and top-level dispatch.
- `core/generator` owns generated command-reference docs.
- `core/filesystem` remains the only writer for generated output from init.

## Dependency Impact

No dependency is added.

## File Write Impact

Doctor performs no writes.

Init writes additional docs through the existing safe write plan and safe write execution pipeline.

## Security Impact

Doctor reads repository memory files and config.

Controls:

- no network calls
- no telemetry
- no `.env` reads
- no secret collection
- no auto-fix writes
- no runtime MCP

## ADR Impact

No new ADR is required.

P9 implements the documented repository health check module without changing architecture policy.
