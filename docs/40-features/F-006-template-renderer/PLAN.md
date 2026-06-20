# Plan: Template Renderer

## Approach

Build a small placeholder renderer as the first `core/generator` primitive.

Keep P3 independent from CLI commands, presets, file loading, and file writing.

## Tasks

1. Add P3 feature docs and generator module memory.
2. Add ADR-0001 for deterministic placeholder rendering.
3. Implement template context validation.
4. Implement template rendering.
5. Add renderer unit tests.
6. Update docs that still name Eta as the template engine.
7. Run verification and complete review evidence.

## Boundaries

Do not implement:

- CLI command parsing.
- Template file loading.
- File writes.
- Preset runtime.
- Generator flows such as feature, ADR, or module generation.
- Eta or any advanced template engine.
- Network, telemetry, MCP runtime, AI API, or cloud behavior.
