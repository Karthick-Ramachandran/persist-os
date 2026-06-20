# Module: CLI

## Purpose

The CLI module owns command parser wiring, user-facing output, and process-level command results.

## Owns

- Commander parser setup.
- `main(argv, io)` test entrypoint.
- Command dispatch.
- Calm user-facing output.
- Exit-code style command results.
- Shared write-summary formatting.

## Does Not Own

- File write rules.
- Config schema.
- Template rendering.
- Preset validation.
- Init document generation rules.
- Feature numbering or generation rules.
- ADR numbering or generation rules.
- Module generation rules.
- Package `bin` or release wiring in P5.
- Network, telemetry, MCP runtime, AI API, or cloud behavior.

## Public Interfaces

- `main`
- `createCliProgram`
- `CliIo`

## Current Decision

P5 adds parser wiring without package `bin` or build/release setup.

P6 routes `feature create <name>` to command orchestration while keeping business rules in core modules.

P7 routes `adr create <title>` to command orchestration while keeping business rules in core modules.

P8 routes `module create <name>` to command orchestration while keeping business rules in core modules.
