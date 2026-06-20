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
