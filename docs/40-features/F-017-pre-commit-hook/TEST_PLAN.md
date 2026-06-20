# Test Plan: Pre-Commit Hook Generation

Risk-based. Main risks: writing outside the root, a non-executable hook, neutrality leaks through
detection, and broken golden output.

## Unit Tests

- `tests/unit/config/config-schema.test.ts`: `preCommitGates` accepts valid commands and rejects
  multi-line or control-character entries.
- `tests/unit/hooks/detect-gates.test.ts`: pnpm/npm/yarn lockfiles map to the right package manager;
  known scripts become proposed gates; no `package.json` yields an empty list.
- `tests/unit/hooks/generate-hook.test.ts`: rendered hook has the shebang, runs `recall doctor`, and
  includes each gate; empty gates render doctor only.
- `tests/unit/filesystem/write-file-safe.test.ts`: executable entries are written with the owner
  execute bit set.

## Integration Tests

- `tests/integration/init-command.test.ts`: init creates an executable `.recall/hooks/pre-commit`
  containing `recall doctor`; init output prints the `git config core.hooksPath` proposal; an
  existing hook is skipped without `--force`.

## Golden Tests

- `tests/golden/generated-*.test.ts`: updated file lists include `.recall/hooks/pre-commit`.

## Safety

- Confirm the hook path resolves within the project root and reuses symlink and traversal
  protections.

## Regression

- `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`,
  `pnpm pack:check`, and `node dist/cli.js doctor`.
