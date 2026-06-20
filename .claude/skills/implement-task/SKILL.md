---
name: implement-task
description: Implement one scoped engineering task while preserving requirements, architecture boundaries, security posture, tests, docs, and completion evidence. Use when implementing a single task from an approved plan.
---

# Skill: Implement Task

## Purpose

Implement a bounded task safely from approved requirements and plans.

## Inputs

- Task description.
- Feature plan or acceptance criteria.
- Relevant module and architecture docs.

## Required Reading

- `AGENTS.md`
- `docs/10-architecture/ARCHITECTURE.md`
- `docs/10-architecture/FILE_WRITE_POLICY.md`
- `docs/20-security/SECURITY_MODEL.md`
- `docs/60-engineering/ENGINEERING_STANDARDS.md`
- Relevant feature, module, and ADR docs.

## Output Files

- Implementation files for the scoped task.
- Tests for changed behavior.
- Updated module, feature, or completion docs when behavior changes.

## Process

1. Confirm the task has clear acceptance criteria.
2. Confirm the task comes after PRD, acceptance, architecture impact, and test plan.
3. Identify affected modules and tests.
4. Implement the smallest safe change.
5. Add or update tests based on risk.
6. Update docs when behavior, architecture, or module ownership changes.
7. Prepare completion evidence with commands and results.

## Stop Conditions

Stop and request human decision if:

- The task conflicts with source-of-truth docs.
- The task conflicts with engineering standards.
- The task requires adding runtime network, telemetry, cloud, MCP, AI API, or generated production app behavior in MVP.
- A dependency is needed without ADR consideration.
- Tests cannot be designed from the available requirements.

## Quality Bar

- Scope stays narrow.
- Tests cover behavior and risk.
- File write and security rules are preserved.
- Engineering standards are followed.
- Completion evidence is concrete.
- One task is implemented at a time.
