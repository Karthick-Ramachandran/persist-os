# Tasks: Recall Adopt

## T1: Plan and decision

- Status: Complete.
- Scope: PRD, acceptance, architecture impact, ADR-0003.
- Acceptance: Adopt is read-only and proposes, never accepts.

## T2: Inspection

- Status: Complete.
- Scope: `inspect-repo.ts` reading manifest and marker files.
- Acceptance: Detects language, package manager, frameworks, tests, docs.
- Tests: Inspection unit tests.

## T3: Generation

- Status: Complete.
- Scope: `generate-adoption.ts` producing the report and proposed ADRs.
- Acceptance: All decisions proposed; report flags review.
- Tests: Generation unit tests.

## T4: Command and CLI

- Status: Complete.
- Scope: `adopt.ts` and CLI registration with dry-run and force.
- Acceptance: Non-destructive; works without existing config.
- Tests: Integration tests.

## T5: Docs, memory, completion

- Status: Complete.
- Scope: Module memory, README, command reference, review, completion report.
- Acceptance: All gates recorded with results.
