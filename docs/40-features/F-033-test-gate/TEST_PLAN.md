# Test Plan: Test Gate Module

## Detection unit tests (`tests/unit/hooks/detect-gates.test.ts`, extended)

- Vitest shape (`test: "vitest"`, `test:run: "vitest run"`) → `test:run` variant.
- `test`-only Vitest shape (`test: "vitest"`, bare watch runner) → null, never the watcher.
- Jest shape (`test: "jest"`) → `test` variant (one-shot by default).
- Jest watch shape (`test: "jest --watch"`) → null.
- No `package.json` → null. `package.json` with neither script → null. Invalid JSON → null.
- Pre-push detection: Vitest repo with typecheck+lint yields `[test, typecheck, lint]` in order;
  bare-test repo omits the test line.

## Gate tests (`tests/integration/test-gate-command.test.ts`, new)

- Genuinely failing command → non-zero exit, output visible.
- Genuinely passing command → exit 0.
- Unconfigured (null, and absent-field legacy config) → loud skip, exit 0, message names
  `testCommand` and how to set it.

## Hook tests (`tests/unit/hooks/generate-hook.test.ts`, rewritten push section)

- Pre-commit and pre-push take different lists; pre-push never contains doctor.
- Pre-push always starts gates with `persist test-gate`, even with null `testCommand`.

## Drift tests (`tests/unit/doctor/hook-drift-check.test.ts`, new)

- Agreement → evaluated, no findings.
- Disagreement (extra gate baked in) → one warning naming the hook + regen command.
- Either hook absent → not-evaluated with reason, no findings.

## Back-compat (`tests/unit/config/config-schema.test.ts`, extended)

- 0.6.x config without the new fields parses with `testCommand: null`, `prePushGates: []`.
- New defaults write both fields; init output prints the selection.

## Regression

- Full `pnpm test:run` green (guard tests deleted, nothing else references `guard`).
- `persist --help` output has no `guard` line (covered by removal + grep in review, no test).
