---
name: create-prd
description: Create or update a feature PRD with user intent, scope, acceptance criteria, non-goals, security notes, test expectations, and source-of-truth links. Use when starting a feature, drafting or updating a PRD, or defining acceptance criteria.
---

# Skill: Create PRD

## Purpose

Create a useful feature PRD that helps humans and AI agents understand what should be built and why.

## Inputs

- Feature name or problem statement.
- User goal or business reason.
- Any existing product notes, tickets, or change requests.

## Required Reading

- `docs/00-product/BRD.md`
- `docs/00-product/PRD.md`
- Relevant existing `docs/40-features/<feature>/`
- Relevant accepted ADRs in `docs/adrs/`

## Output Files

- `docs/40-features/<feature>/PRD.md`
- `docs/40-features/<feature>/ACCEPTANCE.md`, when acceptance criteria are part of the request.
- `docs/40-features/<feature>/CHANGE_REQUESTS.md`, when changing existing requirements.

## Process

1. Identify the user, problem, desired outcome, and non-goals.
2. Link the feature to product goals and existing source-of-truth docs.
3. Define acceptance criteria that can be tested.
4. Capture security, privacy, file write, dependency, and MCP implications.
5. Identify architecture areas that require follow-up review.
6. Keep the PRD concise and implementation-guiding.

## Stop Conditions

Stop and request human decision if:

- Product intent is contradictory.
- A requested behavior conflicts with an accepted ADR.
- The feature adds network, telemetry, AI API, cloud, MCP runtime, auth, secrets, or file write behavior without explicit approval.
- Scope is too broad to define testable acceptance criteria.

## Quality Bar

- The PRD states goals, non-goals, users, acceptance criteria, risks, and source links.
- Acceptance criteria are concrete enough to drive tests.
- Security and architecture implications are not generic filler.
- The PRD does not duplicate full architecture docs.
