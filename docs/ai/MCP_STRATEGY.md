# MCP Strategy

## Purpose

MCP can provide useful external context for AI-assisted development, but it is not required for SpecForge MVP.

SpecForge should document how teams can use MCP safely without making external systems the architectural source of truth.

## MVP Position

SpecForge MVP:

- Does not require MCP.
- Does not connect to MCP servers.
- Does not generate runtime MCP config by default.
- Does not make network calls.
- Does not treat MCP as source of truth.

## Good MCP Uses

Use MCP when source context lives outside the repo:

- Figma for design variables, components, and layout metadata.
- Linear for tickets, project status, and acceptance criteria.
- GitHub for PRs, issues, and review comments.
- Sentry for crash reports and production errors.
- Docs or Notion for product background.

## Bad MCP Uses

Avoid:

- Using Linear as the only architecture source.
- Letting screenshots replace design tokens or specs.
- Using random MCP servers without trust review.
- Letting MCP data override accepted ADRs.
- Sending secrets or sensitive repo data unnecessarily.

## Security Rules

Teams using MCP must:

- Use trusted MCP servers only.
- Apply least-privilege access.
- Avoid exposing secrets.
- Avoid sending sensitive repository data unnecessarily.
- Treat external MCP content as untrusted until validated.
- Avoid random community MCP servers for production projects.
- Document any MCP that becomes part of the workflow.

If MCP changes the development workflow, add an ADR.

## MCP Documentation Template

When a project uses MCP, document:

- Approved MCP servers.
- Purpose of each MCP.
- Data accessed.
- Permissions required.
- Security risks.
- Source-of-truth rules.
- Review cadence.

## Source-Of-Truth Rule

MCP may provide context. MCP does not automatically override repo memory.

Order:

1. Accepted ADRs and repository decisions
2. Architecture docs
3. Engineering standards
4. Current PRD and accepted change requests
5. Security and testing docs
6. Module docs
7. Feature plans
8. Task files
9. MCP external context
10. Chat history

If MCP data conflicts with repo docs, the agent must stop and report the conflict.
