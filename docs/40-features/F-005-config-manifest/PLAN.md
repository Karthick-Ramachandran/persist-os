# Plan: Config Manifest

## Approach

Build the smallest useful config module and dogfood it in the repository.

Keep P2 intentionally boring: schema, defaults, load, write, tests, docs.

## Tasks

1. Add P2 feature docs and config module memory.
2. Add Zod dependency.
3. Implement config schema and default config.
4. Implement load and write helpers.
5. Add root `.specforge/config.json`.
6. Add unit tests for schema, load, and write behavior.
7. Run verification and complete review evidence.

## Boundaries

Do not implement:

- CLI command parsing.
- Template rendering.
- Preset runtime.
- Doctor checks.
- Decision indexing.
- Organization standards indexing.
- Network, telemetry, MCP runtime, or AI API behavior.
