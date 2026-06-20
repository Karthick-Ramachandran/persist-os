# CLI Test Plan

## P5 Tests

- `main(["init"])` creates memory files.
- `main(["init", "--dry-run"])` writes nothing and reports planned files.
- `main(["init", "--force"])` overwrites explicitly.
- `main(["init", "--preset", "nextjs"])` includes preset guidance.
- Unknown presets return failure output and write nothing.

## P5 Results

- Covered by `tests/integration/init-command.test.ts`.
- Covered by golden tests under `tests/golden/`.

## Future Tests

- Package binary execution after build and release wiring exists.
- Output formatting across more commands.
- Exit code mapping for all command families.

## P6 Tests

- `main(["feature", "create", "<name>"])` requires initialized config.
- `feature create` creates required feature docs.
- `feature create --dry-run` writes nothing and reports planned files.
- `feature create --force` overwrites explicitly.
- Unsafe feature names return failure output.

## P6 Results

- Covered by `tests/integration/feature-create-command.test.ts`.
- Full verification passed with `pnpm test:run` and `pnpm typecheck`.
