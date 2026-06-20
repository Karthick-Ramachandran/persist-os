# Plan: Core Filesystem Safety

## Approach

Build P1 as pure TypeScript modules with tests before any CLI command exists.

Core rules:

- Plan before writing.
- Validate every destination.
- Refuse to execute invalid plans.
- Skip existing files by default.
- Overwrite only when explicit.
- Keep generated behavior deterministic.

## Implementation Order

1. Create docs and module memory.
2. Add minimal TypeScript/Vitest scaffold.
3. Implement safe slug naming.
4. Implement safe path resolution.
5. Implement conflict policy and write planning.
6. Implement safe writes and dry-run execution.
7. Add unit and security tests.
8. Update completion report and drift review.

## Boundaries

Do not implement:

- CLI commands.
- Config manifest.
- Presets.
- Template rendering.
- MCP runtime.
- Network calls.
- Telemetry.
- Generated app code.
