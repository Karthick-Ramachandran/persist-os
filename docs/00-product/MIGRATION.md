# Migration Notes: 0.6.x to 1.0

Two breaking changes land in 1.0 (see [ADR-0011](../adrs/ADR-0011-one-zero-stability-contract.md)).
Each names the removal and the exact edit that replaces it.

## `persist guard` removed — replaced by `persist test-gate`

`persist guard` (fail when staged source changed without a test change) is deleted. It checked a
proxy; `persist test-gate` runs your test command and requires it to pass.

- Delete any `persist guard ...` lines from `preCommitGates` / `prePushGates` in
  `.persist/config.json`.
- Set `testCommand` to a one-shot test command (e.g. `"pnpm run test:run"`), or re-run
  `persist init` to detect it. `null` keeps the gate off (it skips loudly).
- Regenerate the hooks so pre-commit runs doctor and pre-push runs the test gate:
  `persist init --force --reinit` (review the diff first — `--force` overwrites).

## `preset` removal from config — pending its own module

The second 1.0 breaking change (removing `preset` from `.persist/config.json`) ships with a later
module and will be documented here when it lands.
