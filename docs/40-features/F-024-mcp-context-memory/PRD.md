# PRD: MCP Context Memory

## Purpose

MCP servers (Figma, Linear, GitHub, Sentry, Notion) give agents valuable external context that
disappears when the conversation ends. This feature lets a repository capture durable MCP-derived
context into committed, reviewable memory, so future work — for example building UI from a Figma
design system — stays consistent and the agent does not re-derive the same context every session.

Recall OS does not connect to MCP servers. It generates the memory; the agent captures into it.

## Problem

- MCP context is ephemeral and lives only in a single conversation.
- `docs/ai/MCP_STRATEGY.md` documents how to think about MCP but provides no per-server memory
  artifact to capture context into.
- Adopting an MCP server into the workflow is a decision that should be reviewable.

## In Scope

- Add a `recall mcp add <server>` command that generates per-server MCP memory.
- Generate `docs/ai/mcp/<server>.md` from the documentation template plus a Captured Context section.
- Generate a proposed ADR for adopting the server.
- Pre-fill purpose and data hints for well-known servers (Figma, Linear, GitHub, Sentry, Notion).
- Keep writes non-destructive and offline.

## Non-Goals

- No connection to MCP servers, no network calls, no live data import.
- No treating MCP context as accepted memory.
- No runtime agent behavior.

## Users

- Teams using MCP servers who want durable, reviewable external context.
- AI agents that should record and re-read MCP-derived context instead of re-deriving it.

## Success Criteria

- `recall mcp add figma` writes `docs/ai/mcp/figma.md` with a purpose, source-of-truth rule, and a
  Captured Context section, plus a proposed ADR.
- Well-known servers get pre-filled purpose and data hints; unknown servers get a usable template.
- The generated ADR is `Proposed`.
- The command is offline and non-destructive.
