# Module: MCP

## Purpose

MCP owns generation of offline, proposed MCP context memory so agents can capture durable
MCP-derived context into the repository.

## Owns

- Known-server purpose and data hints.
- Generation of the per-server MCP memory doc and a proposed adoption ADR.
- The `recall mcp add` command.

## Does Not Own

- Connecting to MCP servers, network calls, or live data import.
- Treating MCP context as accepted memory.
- The write pipeline (reused from `filesystem`) or slugify (reused from `naming`).

## Public Interfaces

- `getKnownServer`
- `generateMcpFiles`, `mcpDocPath`
- `mcpAdd`, `formatMcpAddResult`

## Boundaries

MCP produces static Markdown memory only. It never connects to an MCP server and writes through the
safe, non-destructive pipeline.

## Current Decision

Governed by ADR-0005. `recall mcp add` is offline, pre-fills known servers, and emits a memory doc
plus a proposed adoption ADR. Captured context and the decision stay proposed until accepted.
