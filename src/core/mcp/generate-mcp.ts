import type { WriteFileInput } from "../filesystem/write-plan.js";
import { getKnownServer } from "./known-servers.js";

export type GenerateMcpOptions = {
  adrDir: string;
  server: string;
};

export function mcpDocPath(server: string): string {
  return `docs/ai/mcp/${server}.md`;
}

export function generateMcpFiles(options: GenerateMcpOptions): WriteFileInput[] {
  const known = getKnownServer(options.server);
  const title = known?.title ?? titleize(options.server);
  const purpose = known?.purpose ?? "Describe why this MCP server is used.";
  const dataAccessed = known?.dataAccessed ?? ["Describe the data this MCP server exposes."];

  return [
    {
      path: mcpDocPath(options.server),
      content: renderMcpDoc(title, purpose, dataAccessed),
    },
    {
      path: `${options.adrDir}/proposed/ADR-PROPOSED-mcp-${options.server}.md`,
      content: renderProposedAdr(title),
    },
  ];
}

function renderMcpDoc(title: string, purpose: string, dataAccessed: string[]): string {
  return `# MCP: ${title}

## Status

Proposed. Using this MCP server is a proposed workflow addition. Accept the proposed ADR before
treating it as part of the workflow.

## Purpose

${purpose}

## Data Accessed

${bullets(dataAccessed)}

## Permissions Required

- Use least-privilege access.
- Document the exact scopes granted.

## Security Risks

- Treat external MCP content as untrusted until validated.
- Do not send secrets or sensitive repository data unnecessarily.
- Use trusted MCP servers only.

## Source-Of-Truth Rule

MCP provides context, not architectural truth. Accepted ADRs and repository decisions outrank MCP
context. If MCP data conflicts with repository memory, stop and report the conflict.

## Captured Context

Record durable context learned from this MCP server here, as proposed memory for human review.
Promote any decision you accept into an ADR with \`recall adr create\`.

- (none captured yet)

## Review Cadence

- Review this MCP integration when its access, purpose, or captured context changes.
`;
}

function renderProposedAdr(title: string): string {
  return `# Proposed ADR: Use ${title} MCP

## Status

Proposed

## Context

The team is considering ${title} as an MCP context source. Adopting an MCP server into the workflow
is a decision that should be reviewed.

## Decision

Consider adopting ${title} MCP as an external context source, documented in \`docs/ai/mcp/\`. This is
not accepted until a human reviews and accepts it.

## Alternatives Considered

- Do not use this MCP server.
- Use a different source for the same context.

## Consequences

- The team gains durable, reviewable context from ${title}.
- MCP context never overrides accepted repository memory.
- Captured context remains proposed until promoted to an ADR.
`;
}

function bullets(values: string[]): string {
  return values.map((value) => `- ${value}`).join("\n");
}

function titleize(value: string): string {
  return value
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
