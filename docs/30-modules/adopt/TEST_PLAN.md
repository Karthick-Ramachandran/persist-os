# Adopt Test Plan

## Unit Tests

- Inspection detects language, package manager, frameworks, tests, and README.
- Inspection returns empty signals for an empty repository.
- Generation produces a proposed report and a proposed ADR per framework, never accepted.

## Integration Tests

- `recall adopt` proposes memory without an existing config.
- `--dry-run` writes nothing.
- Existing adoption report is skipped unless `--force`.

## Safety

- Inspection only reads files; it never executes repository code.

## Results

- Covered by `tests/unit/adopt/*` and `tests/integration/adopt-command.test.ts`.
