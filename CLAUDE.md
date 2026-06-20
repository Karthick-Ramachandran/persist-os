# SpecForge Claude Instructions

SpecForge is a local-first TypeScript CLI that creates AI-ready engineering memory for software repositories.

Read these first before non-trivial work:

- `docs/00-product/PRD.md`
- `docs/00-product/BRD.md`
- `docs/00-product/BUILD_PRIORITY.md`
- `docs/10-architecture/ARCHITECTURE.md`
- `docs/10-architecture/MEMORY_ENGINE.md`
- `docs/10-architecture/REPOSITORY_DECISIONS.md`
- `docs/10-architecture/OPINION_PACKS.md`
- `docs/10-architecture/FILE_WRITE_POLICY.md`
- `docs/20-security/SECURITY_MODEL.md`
- `docs/50-quality/QUALITY_GATES.md`
- `docs/60-engineering/ENGINEERING_STANDARDS.md`
- `docs/60-engineering/AI_AGENT_RULES.md`
- `docs/ai/AI_AGENTS_SKILLS_MCP_STRATEGY.md`
- `docs/ai/MODULE_DELIVERY_WORKFLOW.md`

## Working Rules

- P0 is docs and templates only. Do not add runtime CLI code during P0.
- Treat module work as a mini product workflow: PRD, acceptance, architecture impact, test plan, tasks, implementation, completion report, drift review, then module memory update.
- SpecForge Core is architecture-neutral. Do not encode architecture or technology choices as core truth.
- Presets are user-facing CLI presets and architecture-level opinion packs; they may propose choices, not silently accept them.
- Repository rules override model preferences.
- Stop if a request conflicts with engineering standards, including requests to commit secrets, hardcode credentials, bypass auth, add dependencies without review, skip migrations, skip tests without reason, or claim completion without evidence.
- Do not add network calls, telemetry, cloud behavior, AI API calls, runtime MCP, or generated production app code.
- Do not add scripts inside generated skills for MVP.
- Never overwrite existing files by default in future implementation work.
- Treat chat history and MCP data as context, not source of truth.

## Source Of Truth

Follow this order:

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

If sources conflict, stop and report the conflict before changing files.

## Completion Evidence

Every implementation task must report files changed, tests or checks run, skipped checks, remaining risks, and docs updated.
