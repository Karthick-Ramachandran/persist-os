# PRD: Test Gate Module

## Purpose

`persist guard` enforces a proxy — a test file was touched — instead of the property that matters:
the tests pass. Touching a test file satisfies it; a passing suite is neither required nor checked.
This module replaces `guard` with `persist test-gate`, which runs the configured test command and
requires it to pass, and fixes the two adjacent defects that make gates expensive and wrong:
identical pre-commit/pre-push hooks, and gate detection that picks the watch-mode `test` script over
the one-shot `test:run`.

Source of truth: [ADR-0009](../../adrs/ADR-0009-gates-verify-tests-pass.md) (Accepted). Where this
PRD and the ADR disagree, the ADR wins.

## In Scope

- `testCommand: string | null` and `prePushGates: string[]` in `.persist/config.json`, both optional
  on read so pre-existing configs keep loading.
- Detection prefers one-shot scripts (`test:run` over `test`; a bare watch runner is never
  selected); returns null when there is nothing safe to pick. `persist init` prints the selection.
- `persist test-gate`: runs `testCommand` without a shell, mirrors its exit code, surfaces its
  output; skips loudly (exit 0) when unconfigured.
- Hook split: pre-commit runs doctor plus `preCommitGates` (seeded empty); pre-push runs
  `persist test-gate` plus `prePushGates` (seeded with the test command, typecheck, lint).
- `guard` and its tests are deleted (deliberate 1.0 breaking change, budgeted by the 1.0 stability
  contract).
- Doctor `hook-drift` check (warning): generated hooks must match the config that produced them;
  not-evaluated when the hooks do not exist.
- Check-outcome reporting (`checks` array, NOT EVALUATED section) is built in this module: main has
  no such mechanism — the earlier change was branched, not merged. No exit-code or severity changes,
  `schemaVersion` stays `persist.doctor.v1`.

## Non-Goals

- Rewriting the five checks whose inputs change under the minimal-memory work.
- Changing which documents doctor requires, or any finding severity.
- Configurable staleness thresholds.
- Interactive `persist init` (detection is seeded non-interactively; questions come later).
- The Chesterton fence; removing `preset` from config (different module, same release).
- Touching skills or presets.

## Decisions

- Command name is `test-gate` (clearer than `verify`; matches the ADR's language).
- `testCommand` is split on whitespace and run with `execFile` (no shell, no concatenation).
- The pre-push hook always emits `persist test-gate`, even when `testCommand` is null — the loud
  skip is the reminder to configure it, and drift comparison stays deterministic.
- New migration file `docs/00-product/MIGRATION.md` holds the guard-removal line; the second 1.0
  breaking change (preset removal) is noted there as pending its own module.
