# Testing Strategy

## Purpose

SpecForge tests should prove behavior that matters: safe writes, deterministic generation, useful docs, and predictable CLI output.

## Test Levels

- Unit tests for pure core logic.
- Integration tests for command behavior.
- Security tests for malicious inputs and unsafe filesystem states.
- Golden tests for generated output.
- CLI behavior tests for output, errors, and exit codes.
- Preset contract tests for built-in presets.

## P1 Priority

The first implementation tests must cover filesystem safety:

- Reject path traversal.
- Reject absolute paths.
- Reject null bytes.
- Reject empty names.
- Skip existing files by default.
- Dry run writes nothing.
- Force does not bypass path safety.
- Unsafe symlink writes are refused by default.

## Test Naming

Good names:

- `rejects path traversal in feature names`
- `skips existing CLAUDE.md by default`
- `creates next ADR number from highest existing ADR`

Bad names:

- `works`
- `test init`
- `utils test`

## Completion Reports

Every task completion report must list:

- Test commands run.
- Results.
- Skipped tests and why.
- Known gaps.
- Generated snapshots updated intentionally, when applicable.
