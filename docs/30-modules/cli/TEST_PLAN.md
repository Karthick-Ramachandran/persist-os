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

## P7 Tests

- `main(["adr", "create", "<title>"])` requires initialized config.
- `adr create` creates proposed ADR files.
- `adr create --dry-run` writes nothing and reports planned files.
- `adr create --force` overwrites explicitly.
- Unsafe ADR titles return failure output.

## P7 Results

- Covered by `tests/integration/adr-create-command.test.ts`.
- Full verification passed with `pnpm test:run` and `pnpm typecheck`.

## P8 Tests

- Existing init, feature, and ADR command tests preserve output behavior after write-summary helper extraction.
- `main(["module", "create", "<name>"])` requires initialized config.
- `module create` creates module docs.
- `module create --dry-run` writes nothing and reports planned files.
- `module create --force` overwrites explicitly.
- Unsafe module names return failure output.

## P8 Results

- Covered by `tests/integration/module-create-command.test.ts`.
- Regression-covered by init, feature, and ADR command integration tests.
- Full verification passed with `pnpm test:run` and `pnpm typecheck`.

## P9 Tests

- `main(["doctor"])` reports Doctor findings.
- Missing config returns exit code `2`.
- Healthy initialized repositories return exit code `0`.
- Doctor output includes grouped findings and result status.

## P9 Results

- Covered by `tests/integration/doctor-command.test.ts`.
- Focused P9 verification passed.
- Full verification passed with `pnpm test:run`, `pnpm typecheck`, and `git diff --check`.
