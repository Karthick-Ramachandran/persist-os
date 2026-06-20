# Completion Report: MCP Context Memory

## Status

Complete.

## Tasks Completed

- T1: Planned the feature and accepted ADR-0005 (proposed and offline).
- T2: Implemented known-server hints and MCP memory + proposed-ADR generation.
- T3: Added the `recall mcp add` command and CLI wiring.
- T4: Added module memory, docs, tests, and completion evidence.

## Files Changed

- `src/core/mcp/known-servers.ts`, `src/core/mcp/generate-mcp.ts` (new)
- `src/commands/mcp/add.ts` (new)
- `src/cli/main.ts`, `src/core/generator/generate-init.ts`
- `tests/unit/mcp/generate-mcp.test.ts`, `tests/integration/mcp-command.test.ts` (new)
- `docs/adrs/ADR-0005-mcp-context-memory-is-proposed-and-offline.md` (new)
- `docs/30-modules/mcp/` (new module memory)
- `docs/40-features/F-024-mcp-context-memory/` (new feature memory)
- `docs/ai/RECALL_COMMANDS.md`, `README.md`
- `examples/generated-*/` (regenerated command reference)

## Tests Run

- `pnpm test:run`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check`
- `pnpm build`
- `pnpm pack:check`
- `node dist/cli.js doctor`

## Results

- Full test suite passed: 48 files, 225 tests (6 new for MCP).
- `pnpm typecheck`, `pnpm lint`, and `pnpm format:check` passed.
- `pnpm build` passed; `pnpm pack:check` validated 169 files.
- `node dist/cli.js doctor` passed after this report was written.
- Manual verification: `recall mcp add figma` generated `docs/ai/mcp/figma.md` (design-context
  purpose, Captured Context, source-of-truth rule) and a proposed adoption ADR, offline.

## Remaining Risks

- A fixed set of well-known servers is pre-filled; other servers use a generic template.
- A dedicated `capture-mcp-context` agent skill is deferred; capture guidance is currently inline in
  the generated memory.

## Docs Updated

- ADR-0005, F-024 feature memory, MCP module memory, command reference, and README.

## Engineering Standards

Engineering standards were followed. The change is scoped, tested, documented, and governed by an
accepted ADR. The command is offline, non-destructive, proposes rather than accepts, and adds no
network, telemetry, dependency, or runtime MCP behavior.
