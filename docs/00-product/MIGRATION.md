# Migration Notes: 0.6.x to 1.0

Two breaking changes land in 1.0 (see [ADR-0011](../adrs/ADR-0011-one-zero-stability-contract.md)).
Each names the removal and the exact edit that replaces it.

## Upgrade the global binary first

The generated hooks call `persist` from `PATH`, so a 0.6.x binary still installed globally
keeps running the old behaviour in every hook — including blocking commits on warnings — until
it is upgraded. Upgrade before regenerating anything:

```sh
npm install -g persist-os@latest
```

One behaviour change is not breaking but changes what a commit does: generated pre-commit hooks
now treat doctor warnings as advisory and fail only on errors (see
[ADR-0013](../adrs/ADR-0013-warnings-are-advisory-in-the-generated-pre-commit-hook.md)). Commits
that warnings previously refused will now proceed. To keep the old behaviour, add
`"persist doctor"` to `preCommitGates` in `.persist/config.json` (it runs under `set -e`, so its
exit 1 blocks again). Either way, regenerate the hook to pick up the new content:
`persist init --force --reinit` (review the diff first — `--force` overwrites).

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
