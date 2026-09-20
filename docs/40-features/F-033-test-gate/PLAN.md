# Plan: Test Gate Module

Ordered, one task per commit-sized step. Guard deletion lands with its replacement in the same
change so no commit leaves `guard` referenced but missing (or vice versa).

1. Config fields + defaults (`config-schema.ts`, `default-config.ts`).
2. Detection (`detect-gates.ts`): `detectTestCommand`, `detectPrePushGates`, shared pm probe.
3. Hook renderers split (`generate-hook.ts`).
4. `test-gate` command (`src/commands/test-gate.ts`) + CLI registration.
5. `init` seeds both lists and prints the selection (`init.ts`).
6. Delete `guard.ts`, its CLI registration, its tests; template docs + README + MIGRATION.md.
7. Outcome mechanism (`doctor-check.ts`, `doctor-report.ts`) + `hook-drift-check.ts` + wiring.
8. Tests for all of the above; back-compat test.
9. Module memory updates (hooks, config, doctor, cli, generator); REVIEW, COMPLETION_REPORT.
10. Evidence chain: test, typecheck, lint, format, build, doctor.
