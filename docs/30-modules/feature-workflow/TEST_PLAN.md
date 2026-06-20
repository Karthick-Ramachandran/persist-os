# Feature Workflow Test Plan

## P6 Tests

- Feature command creates required feature docs.
- Feature command starts at `F-001`.
- Feature command increments feature numbers.
- Feature command reuses existing same-slug feature folders.
- Feature command rejects unsafe names.
- Feature command skips existing files by default.
- Feature command supports dry run and force.

## Future Tests

- Generated feature docs become richer without breaking golden expectations.
- Doctor detects stale or incomplete feature memory.

## P6 Results

- Covered by `tests/integration/feature-create-command.test.ts`.
- Full verification passed with `pnpm test:run` and `pnpm typecheck`.
