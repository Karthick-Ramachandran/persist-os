# Plan: Init Command

## Approach

Implement a minimal product-grade init flow.

Use in-code deterministic templates for P5. Do not load template files from disk.

## Tasks

1. Add P5 feature docs and CLI/module memory.
2. Add Commander dependency.
3. Add init generation planning.
4. Add init command orchestration.
5. Add testable CLI parser and `main(argv, io)`.
6. Add integration and golden tests.
7. Run verification and complete review evidence.

## Boundaries

Do not implement:

- Package `bin`.
- Build or release tooling.
- `preset list`.
- Technology detection.
- Full framework template sets.
- Network, telemetry, MCP runtime, AI API, or cloud behavior.
