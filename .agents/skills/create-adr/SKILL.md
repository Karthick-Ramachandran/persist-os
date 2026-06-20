---
name: create-adr
description: Create an Architecture Decision Record for a meaningful architecture, dependency, security, file-write, MCP, or workflow decision.
---

# Skill: Create ADR

## Purpose

Record durable architecture decisions so future humans and agents do not rediscover or contradict them.

## Inputs

- Decision topic.
- Context and constraints.
- Options considered.
- Recommended or selected decision.

## Required Reading

- `docs/10-architecture/ARCHITECTURE.md`
- `docs/10-architecture/TECH_STACK.md`
- `docs/10-architecture/DEPENDENCY_POLICY.md`
- `docs/10-architecture/FILE_WRITE_POLICY.md`
- `docs/20-security/SECURITY_MODEL.md`
- Relevant existing ADRs in `docs/adrs/`

## Output Files

- `docs/adrs/ADR-####-<slug>.md`

## Process

1. Determine whether the change needs an ADR.
2. Find the next ADR number without reusing existing numbers.
3. Write context, decision, alternatives, consequences, and related docs.
4. Mark the status as `Proposed` unless the human has accepted the decision.
5. Link to affected PRDs, architecture docs, feature docs, and security docs.

## Stop Conditions

Stop and request human decision if:

- The decision changes security posture, network behavior, telemetry, file writes, auth, secrets, cloud, or runtime MCP.
- The requested decision conflicts with an accepted ADR.
- The decision is not actually made yet and should remain an RFC or proposal.

## Quality Bar

- ADR explains why the decision exists, not just what changed.
- Alternatives and consequences are honest.
- Status is clear.
- Related documents are linked.
