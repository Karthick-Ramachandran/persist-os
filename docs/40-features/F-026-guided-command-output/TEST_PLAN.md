# Test Plan: Guided Command Output

## Integration Tests (`tests/integration/guided-output.test.ts`)

- `init` prints next steps with the first commands.
- `adr create` names the ADR file and sections to fill.
- `feature`, `module`, `skill`, and `mcp` commands each print next steps with their key file.
- A dry run prints no next steps.

## Regression

- `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`,
  `pnpm pack:check`, `node dist/cli.js doctor`.
