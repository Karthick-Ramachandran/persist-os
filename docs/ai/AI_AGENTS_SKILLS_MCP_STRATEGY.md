# AI Agents, Skills, And MCP Strategy

## Purpose

SpecForge should help repositories work better with AI coding tools by generating durable instructions, reusable workflows, and integration guidance.

This includes:

- AI agent instruction files.
- Skill files.
- Review agent workflows.
- MCP integration guidance.
- Tool-specific rules for Claude Code, Codex-compatible tools, Cursor, and future agents.

SpecForge does not run agents itself in the MVP.

SpecForge prepares the repository so agents can work safely.

## AI Agent Instruction Files

Initial supported targets:

```txt
claude
codex
cursor
generic
```

Generated outputs:

```txt
CLAUDE.md
AGENTS.md
.claude/skills/
.agents/skills/
.cursor/rules/
docs/ai/
```

Root instruction files should stay short. They should point agents to durable source-of-truth documents instead of duplicating the entire handbook.

## Agent Roles

SpecForge-generated repositories should define common AI agent roles:

- Product Agent
- Architecture Agent
- Implementation Agent
- Test Agent
- Security Review Agent
- Architecture Drift Review Agent
- Documentation Agent
- Release Review Agent

These are role definitions for prompting and workflow design, not separate runtime processes in MVP.

## Recommended Workflow

Every implementation should follow:

1. Product or PRD draft.
2. Architecture impact review.
3. Task planning.
4. Implementation.
5. Test creation or update.
6. Self-review.
7. Fresh-context review.
8. Architecture drift review.
9. Security review, when relevant.
10. Module docs update.
11. Completion report.
12. Human review.

AI can draft and execute parts of this workflow. Humans own final decisions.

## Skills

Skills are reusable AI workflows.

SpecForge should generate Claude-style skill files where supported and portable Agent Skills-compatible workflow instructions for other tools.

MVP skills:

- `create-prd`
- `plan-feature`
- `plan-module`
- `create-adr`
- `implement-task`
- `write-tests`
- `security-review`
- `architecture-drift-review`
- `update-module-memory`
- `completion-report`

Each skill must be focused on one job and include:

- `name`
- `description`
- purpose
- inputs
- required reading
- output files
- process
- stop conditions
- quality bar

Skills should route agents to source-of-truth docs instead of copying those docs.

## Module-As-Mini-Product Rule

When a human asks an agent to build a module, the agent must treat that module as a mini product inside the repository.

The workflow is:

```txt
Module request
-> Module brief
-> User stories / use cases
-> Acceptance criteria
-> Architecture impact
-> Test plan
-> Task breakdown
-> Build one task at a time
-> Completion report
-> Drift review
-> Module memory update
```

A module request should create feature-level delivery docs under `docs/40-features/` and module memory under `docs/30-modules/` before implementation starts.

## Skill Targets

SpecForge should generate:

- `.claude/skills/<skill>/SKILL.md` for Claude Code.
- `.agents/skills/<skill>/SKILL.md` as SpecForge's portable/generic skill target for Codex-compatible or Agent Skills-compatible tools.

Do not claim `.agents/skills` is required by every tool. Treat it as the portable target SpecForge emits.

## MCP Strategy

MCP stands for Model Context Protocol.

SpecForge should not require MCP in MVP.

MCP may provide external context from tools like:

- Figma
- Linear
- GitHub
- Sentry
- Docs or Notion

MCP is external context, not architectural truth.

## MCP Source-Of-Truth Rule

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

## MVP Requirement

For MVP, SpecForge should:

- Generate `CLAUDE.md`.
- Generate `AGENTS.md`.
- Generate optional Cursor rules.
- Generate AI skill files for reusable workflows.
- Generate `docs/ai/MCP_STRATEGY.md`.
- Define agent roles and review workflow.
- Not require MCP.
- Not connect to MCP servers.
- Not make network calls.
- Not run AI agents itself.
