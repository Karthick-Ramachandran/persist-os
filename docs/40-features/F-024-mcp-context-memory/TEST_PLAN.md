# Test Plan: MCP Context Memory

## Unit Tests

- `tests/unit/mcp/generate-mcp.test.ts`: figma pre-fills design purpose; unknown server uses a usable
  template; the memory doc has all template sections; the ADR is `Proposed`.

## Integration Tests

- `tests/integration/mcp-command.test.ts`: `recall mcp add figma` writes the memory doc and proposed
  ADR; `--dry-run` writes nothing; existing files are skipped unless `--force`; works without config.

## Safety

- Confirm the command performs no network calls (it only renders and writes static content).

## Regression

- `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`,
  `pnpm pack:check`, `node dist/cli.js doctor`.
