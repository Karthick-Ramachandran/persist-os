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

## `preset` config field and `persist preset list` removed

Presets (opinion packs: `src/presets/`, `persist preset list`, `persist init --preset`) are retired.
Architecture stays neutral; stack guidance now lives in hand-written ADRs.

- Delete the `"preset"` line from `.persist/config.json`. A config that still contains it fails to
  parse with an error naming the field — that error is the migration prompt, not a bug: remove the
  line and re-run `persist doctor`.
- Delete any generated `docs/ai/presets/` output. Future `persist init` runs no longer create it.
