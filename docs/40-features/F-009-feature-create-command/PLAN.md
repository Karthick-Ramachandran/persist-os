# Plan: Feature Create Command

## Approach

Implement feature creation as a narrow command workflow.

Keep business logic in core modules and command code focused on orchestration.

## Tasks

1. Add P6 feature docs and feature-workflow module memory.
2. Implement feature numbering and idempotent existing-slug resolution.
3. Implement feature document generation.
4. Implement feature create command orchestration.
5. Wire `feature create <name>` into the CLI parser.
6. Add unit and integration tests.
7. Run verification and complete review evidence.

## Boundaries

Do not implement:

- ADR create.
- Module create.
- Doctor.
- Rich templates.
- Package binary wiring.
- Network, telemetry, MCP runtime, AI API, cloud behavior, or app code generation.
