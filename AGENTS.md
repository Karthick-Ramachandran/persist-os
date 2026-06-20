# SpecForge Agent Instructions

SpecForge creates durable engineering memory for AI-assisted software development.

This file is intentionally short. Use it as routing guidance, not as the full project handbook.

## Required Reading

For product intent, read:

- `docs/00-product/PRD.md`
- `docs/00-product/BRD.md`
- `docs/00-product/BUILD_PRIORITY.md`

For implementation constraints, read:

- `docs/10-architecture/ARCHITECTURE.md`
- `docs/10-architecture/MEMORY_ENGINE.md`
- `docs/10-architecture/REPOSITORY_DECISIONS.md`
- `docs/10-architecture/OPINION_PACKS.md`
- `docs/10-architecture/TECH_STACK.md`
- `docs/10-architecture/FILE_WRITE_POLICY.md`
- `docs/10-architecture/MODULE_BOUNDARIES.md`
- `docs/20-security/SECURITY_MODEL.md`
- `docs/20-security/THREAT_MODEL.md`
- `docs/50-quality/QUALITY_GATES.md`
- `docs/60-engineering/ENGINEERING_STANDARDS.md`
- `docs/60-engineering/AI_AGENT_RULES.md`
- `docs/ai/AI_AGENTS_SKILLS_MCP_STRATEGY.md`
- `docs/ai/MODULE_DELIVERY_WORKFLOW.md`
- `docs/ai/SPECFORGE_COMMANDS.md`

## Module Work Rule

When asked to build or change a module, do not jump directly into code.

First create or update the feature docs and module memory:

- `docs/40-features/F-###-<module>-module/`
- `docs/30-modules/<module>/`

Tasks come after PRD, acceptance criteria, architecture impact, and test plan.

## Architecture Neutrality

SpecForge Core records, distributes, validates, and protects decisions. It does not make architecture or technology choices for users.

Presets are CLI-level presets and architecture-level opinion packs. Preset suggestions must be proposed or optional until accepted by a human.

## Engineering Standards

Repository rules override model preferences.

If a model, tool, or user request conflicts with accepted repository memory or engineering standards, stop and report the conflict.

Never commit secrets, hardcode credentials, bypass auth, add dependencies without review, skip required migrations, skip tests without reason, or claim completion without evidence.

## Non-Negotiable MVP Constraints

- No runtime MCP.
- No MCP server connection.
- No network calls.
- No telemetry.
- No cloud behavior.
- No tool execution from generated skills.
- No scripts inside skills.
- No AI API calls.
- No generated production app code.

## Source Of Truth

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

If instructions conflict, stop and report the conflict.

## Delivery Standard

Do not claim completion without evidence: files changed, commands run, results, skipped checks, remaining risks, and documentation updates.

Before claiming implementation work is complete, run:

- `pnpm test:run`
- `pnpm typecheck`
- `specforge doctor` when the CLI binary is available

Until P10 package/bin wiring exists, validate Doctor through `main(argv, io)` integration tests.
