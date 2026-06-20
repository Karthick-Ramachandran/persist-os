# Module Workflow Test Plan

## P8 Tests

- Module command creates required module docs.
- Module command rejects unsafe names.
- Module command skips existing files by default.
- Module command supports dry run and force.
- Module command respects configured `modulesDir`.

## Future Tests

- Doctor detects stale or incomplete module memory.
- Module relationships and dependency drift are checked when doctor exists.

## P8 Results

- Covered by `tests/integration/module-create-command.test.ts`.
- Full verification passed with `pnpm test:run` and `pnpm typecheck`.
