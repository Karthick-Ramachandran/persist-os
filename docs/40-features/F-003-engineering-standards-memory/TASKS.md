# Tasks: Engineering Standards Memory

## T0: Add Engineering Standards Docs

Status: Done

Scope:

- `docs/60-engineering/ENGINEERING_STANDARDS.md`
- `docs/60-engineering/AI_AGENT_RULES.md`
- `docs/60-engineering/CODE_REVIEW_RULES.md`

Acceptance:

- Only three initial standards docs are created.
- Detailed rule categories live inside `ENGINEERING_STANDARDS.md`.

## T1: Add Feature Docs And Module Memory

Status: Done

Scope:

- `docs/40-features/F-003-engineering-standards-memory/`
- `docs/30-modules/engineering-standards/`
- `docs/30-modules/agent-rules/`

Acceptance:

- P1.6 is dogfooded.

## T2: Update Product And Memory Model

Status: Done

Scope:

- Product docs.
- Memory engine docs.
- Project structure docs.

Acceptance:

- Engineering Standards Memory is a first-class pillar.
- Product docs use Engineering Memory Operating System positioning.

## T3: Update Agent And Review Routing

Status: Done

Scope:

- Root agent docs.
- Review docs.
- Drift docs.
- Relevant skills.

Acceptance:

- Agents route to engineering standards.
- Repository rules override model preferences.
- Standards violations are review/drift findings.

## T4: Verify And Complete

Status: Done

Scope:

- Existing tests.
- Typecheck.
- Manual docs review.
- Completion report.

Acceptance:

- `pnpm test:run` passes.
- `pnpm typecheck` passes.
- No runtime scope changed.
