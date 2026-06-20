# Doctor Test Plan

## P9 Tests

- Healthy initialized repo exits `0`.
- Missing config exits `2`.
- Invalid config exits `2`.
- Missing required docs exits `2`.
- Missing configured directories exits `2`.
- Feature folders missing docs exit `2`.
- Module folders missing docs exit `2`.
- ADR files missing required sections exit `2`.
- Warnings-only reports exit `1`.
- Info counts appear in output.

## P9 Results

- Covered by `tests/unit/doctor/doctor-report.test.ts`.
- Covered by `tests/unit/doctor/doctor-checks.test.ts`.
- Covered by `tests/integration/doctor-command.test.ts`.
- Focused P9 verification passed for Doctor, init command, and generic golden tests.
- Full verification passed with `pnpm test:run`, `pnpm typecheck`, and `git diff --check`.

## Future Tests

- Accepted ADR drift detection.
- Module ownership drift detection.
- Dependency drift detection.
- Stale completion evidence detection.
