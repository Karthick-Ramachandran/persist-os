# Module: CLI

## Purpose

The CLI module owns command parser wiring, user-facing output, and process-level command results.

## Owns

- Commander parser setup.
- `main(argv, io)` test entrypoint.
- Command dispatch.
- Calm user-facing output.
- Exit-code style command results.

## Does Not Own

- File write rules.
- Config schema.
- Template rendering.
- Preset validation.
- Init document generation rules.
- Package `bin` or release wiring in P5.
- Network, telemetry, MCP runtime, AI API, or cloud behavior.

## Public Interfaces

- `main`
- `createCliProgram`
- `CliIo`

## Current Decision

P5 adds parser wiring without package `bin` or build/release setup.
