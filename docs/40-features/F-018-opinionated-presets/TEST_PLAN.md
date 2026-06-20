# Test Plan: Opinionated Presets

Risk-based. Main risks: a preset that fails validation, a non-proposed decision, broken golden
anchors, and duplicate destinations.

## Unit Tests (`tests/unit/presets/opinionated-presets.test.ts`)

- Every built-in preset validates through `parsePreset`.
- `kotlin-android` and `python-fastapi` are registered and resolvable by id.
- Each of the four batch presets exposes at least four proposed decisions.
- Every preset decision has status `Proposed`.
- All preset destinations are unique within a preset.

## Golden Tests

- `kotlin-android` and `python-fastapi` golden tests: init writes their guidance and a proposed ADR.
- Existing `ios-swift` and `nextjs` golden anchors continue to hold.

## Integration Tests

- `recall preset list` includes the two new presets.

## Regression

- `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`,
  `pnpm pack:check`, and `node dist/cli.js doctor`.
