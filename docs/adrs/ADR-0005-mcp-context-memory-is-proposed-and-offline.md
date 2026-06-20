# ADR-0005: MCP Context Memory Is Proposed And Offline

## Status

Accepted

## Context

MCP (Model Context Protocol) servers like Figma, Linear, GitHub, and Sentry give AI agents fresh
external context. That context is valuable but ephemeral: once the conversation ends, the design
tokens or ticket details an agent learned are gone. Teams want that durable context captured in the
repository so future work is consistent.

Recall OS must help with this without violating its anti-scope: it does not connect to MCP servers,
make network calls, or treat MCP data as architectural truth (`docs/ai/MCP_STRATEGY.md`).

## Decision

`recall mcp add <server>` generates reviewable MCP memory; it never connects to the MCP server.

- It writes `docs/ai/mcp/<server>.md` from the MCP documentation template (purpose, data accessed,
  permissions, security risks, source-of-truth rule, review cadence) plus a "Captured Context"
  section where the agent records durable, proposed context learned from the server.
- It writes a proposed ADR `docs/adrs/proposed/ADR-PROPOSED-mcp-<server>.md`, because adopting an MCP
  server into the workflow is a decision that requires human acceptance.
- Recall OS does not call the MCP server, make network calls, or import live data. The agent uses MCP
  through its own tools and records durable context into the generated memory as proposed.
- MCP context never outranks accepted repository memory. If MCP data conflicts with repository
  memory, the agent stops and reports the conflict.
- Writes are non-destructive: existing files are skipped unless `--force`.

## Alternatives Considered

- Connect to MCP servers and import context directly. Rejected: runtime MCP and network calls are
  anti-scope, and it would make external data a silent source of truth.
- Treat captured MCP context as accepted memory. Rejected: external context must be reviewed and, if
  adopted, promoted to an accepted ADR.
- Do nothing and rely on prose in `MCP_STRATEGY.md`. Rejected: teams need a concrete, per-server
  memory artifact to capture context into.

## Consequences

- Durable MCP-derived context (for example Figma design tokens and component mappings) can be
  recorded in committed, reviewable memory and re-read in future sessions.
- Recall OS stays offline and architecture-neutral.
- Captured context and the MCP decision remain proposed until a human accepts them.

## Related Documents

- `docs/40-features/F-024-mcp-context-memory/`
- `docs/ai/MCP_STRATEGY.md`
- `docs/ai/AI_AGENTS_SKILLS_MCP_STRATEGY.md`
