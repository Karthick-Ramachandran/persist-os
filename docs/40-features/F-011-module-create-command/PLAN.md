# Plan: Module Create Command

## Approach

Implement module creation as a narrow command workflow.

Keep business logic in core modules and command code focused on orchestration.

Extract only shared write-summary formatting to avoid repeating the same output helper across every command.

## Tasks

1. Add P8 feature docs and module-workflow memory.
2. Extract shared write-summary output helper.
3. Implement module document generation.
4. Implement module create command orchestration.
5. Wire `module create <name>` into the CLI parser.
6. Add unit and integration tests.
7. Run verification and complete review evidence.

## Boundaries

Do not implement:

- automatic feature folder creation
- module dependency graph analysis
- doctor
- rich templates
- config or command error refactoring beyond write-summary output
- package binary wiring
- network, telemetry, MCP runtime, AI API, cloud behavior, or app code generation
