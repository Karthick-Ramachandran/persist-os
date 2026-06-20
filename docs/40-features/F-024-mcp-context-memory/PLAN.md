# Plan: MCP Context Memory

## Approach

Add an `mcp` concern that generates per-server memory and a proposed ADR, reusing the safe write
pipeline. The command is offline (ADR-0005).

## Steps

1. `known-servers.ts`: purpose and data hints for Figma, Linear, GitHub, Sentry, Notion.
2. `generate-mcp.ts`: render `docs/ai/mcp/<server>.md` and a proposed ADR.
3. `commands/mcp/add.ts`: load config or defaults, build the write plan, execute; register in CLI.
4. Add unit and integration tests; update module memory and docs.

## Out Of Scope

- Connecting to MCP servers or importing live data.
- A dedicated capture skill (follow-up).
