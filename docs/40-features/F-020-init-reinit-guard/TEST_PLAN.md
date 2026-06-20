# Test Plan: Init Reinit Guard

## Integration Tests (`tests/integration/init-command.test.ts`)

- `init --force` on an existing installation refuses, exits non-zero, mentions `--reinit`, and
  preserves an edited file.
- `init --force --reinit` on an existing installation overwrites generated files.
- Existing tests confirm `--force` in a fresh directory still overwrites, and plain `init` still
  skips existing files.

## Manual Verification

- Built CLI refuses `init --force` in a directory with `.recall/config.json` and proceeds with
  `--reinit`.

## Regression

- `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`,
  `pnpm pack:check`, and `node dist/cli.js doctor`.
