# Plan: Empty-Folder Init And Repository Memory First

## Approach

Document the empty-folder init decision as a product and architecture principle before runtime init implementation.

## Tasks

1. Add P1.7 feature docs.
2. Add repository init and repository memory module memory.
3. Update product docs with repository-memory-first and empty-folder init language.
4. Update architecture docs with init workflows and opinion-pack boundaries.
5. Sync root product docs from canonical docs.
6. Run automated checks and manual docs review.
7. Complete review and completion report.

## Boundaries

Do not implement:

- CLI runtime.
- Config schema changes.
- Template generation changes.
- Preset runtime behavior.
- Technology detection.
- `adopt`.
- MCP runtime.
- Network calls.
- Telemetry.
- Dependency changes.
- Generated production app code.
