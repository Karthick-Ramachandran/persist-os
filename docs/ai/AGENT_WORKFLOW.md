# Agent Workflow

## Standard Flow

Every meaningful implementation should move through:

1. Product or PRD draft.
2. Acceptance criteria.
3. Architecture impact review.
4. Test plan.
5. Task planning.
6. Implementation, one task at a time.
7. Test creation or update.
8. Self-review.
9. Fresh-context review.
10. Architecture drift review.
11. Security review, when relevant.
12. Module docs update.
13. Completion report.
14. Human review.

## Module Work

Treat a module as a mini product inside the repository.

For a request like `Build the preset module for SpecForge`, do not start with code.

First create or update:

```txt
docs/40-features/F-###-preset-module/
  PRD.md
  ACCEPTANCE.md
  ARCHITECTURE_IMPACT.md
  PLAN.md
  TASKS.md
  TEST_PLAN.md
  REVIEW.md
  COMPLETION_REPORT.md

docs/30-modules/presets/
  MODULE.md
  TASKS.md
  TEST_PLAN.md
  DECISIONS.md
```

The correct hierarchy is:

```txt
PRD = why and what
Acceptance = how we know it works
Architecture Impact = what it changes
Test Plan = how we prove it
Tasks = how we execute it
Completion Report = what actually happened
Module Memory = what future agents need to remember
```

Tasks alone are too shallow. PRD alone is too passive. The combo is the system.

## Required Reading

Agents should start with:

- Product docs for intent.
- Architecture docs for boundaries.
- Engineering standards for how work must be done.
- Security docs for risk posture.
- Quality docs for acceptance evidence.
- Relevant feature, module, ADR, or task docs.

## Stop Conditions

Stop and request human decision when:

- Source-of-truth docs conflict.
- A request conflicts with engineering standards.
- Accepted ADR conflicts with requested work.
- Network, telemetry, cloud, MCP runtime, auth, secrets, storage, or file write behavior changes.
- A dependency is added without ADR consideration.
- Tests cannot be run and risk is not documented.
- Completion evidence is missing.

## Completion Output

Every implementation should end with:

- Files changed.
- Tests or checks run.
- Results.
- Skipped checks and reason.
- Docs updated.
- Remaining risks.
