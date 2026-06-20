# MCP Decisions

## ADR-0005: Proposed And Offline

`recall mcp add` never connects to MCP servers, makes no network calls, and imports no live data. It
generates static, reviewable memory.

## Proposed, Not Accepted

The generated memory and adoption ADR are proposed. Captured context is promoted to an ADR only when
a human accepts it.

## Source-Of-Truth Rule

MCP provides context, not architectural truth. Accepted repository memory outranks MCP context.
