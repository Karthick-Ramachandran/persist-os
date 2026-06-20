# Architecture Impact: MCP Context Memory

## Affected Modules

- `cli`: registers `recall mcp add`.
- `mcp` (new): known-server hints and MCP memory generation.

Reuses `config`, `filesystem` (write pipeline), and `naming` (slugify), and the proposed-ADR format.

## New Behavior

- New `src/core/mcp/known-servers.ts` with purpose and data hints for well-known servers.
- New `src/core/mcp/generate-mcp.ts` rendering the MCP memory doc and a proposed ADR.
- New `src/commands/mcp/add.ts` orchestrating non-destructive writes.
- `recall mcp add <server>` with `--dry-run` and `--force`.

## Decision Records

- Governed by ADR-0005 (MCP Context Memory Is Proposed And Offline), which is accepted.

## Security Impact

- The command is offline: no network calls, no MCP connection, no live data import.
- Generated content is static Markdown. Writes reuse the safe pipeline: confined to the project root,
  symlink-protected, non-destructive by default.
- The generated memory documents least-privilege and untrusted-content rules so teams use MCP safely.

## Compatibility

- Adds `docs/ai/mcp/` artifacts and a proposed ADR; existing files are never overwritten by default.
- Works with or without an existing Recall config.
