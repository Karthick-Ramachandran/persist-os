# Plan: Preset System

## Approach

Build preset contracts plus minimal built-in content.

Keep P4 focused on validation and registry behavior. Rich framework content belongs to later work after the model proves useful.

## Tasks

1. Add P4 feature docs and preset module memory.
2. Implement preset schema and validation.
3. Implement built-in preset registry.
4. Add minimal built-in presets.
5. Add unit tests for schema, validation, and registry behavior.
6. Update opinion-pack module memory.
7. Run verification and complete review evidence.

## Boundaries

Do not implement:

- CLI command parsing.
- Init command behavior.
- Template file loading.
- File writes.
- Runtime preset execution.
- Rich framework template sets.
- Network, telemetry, MCP runtime, AI API, or cloud behavior.
