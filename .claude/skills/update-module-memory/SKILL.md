---
name: update-module-memory
description: Update module memory docs after module behavior, ownership, boundaries, tests, risks, or decisions change.
---

# Skill: Update Module Memory

## Purpose

Keep module docs accurate so agents do not rediscover ownership, boundaries, tests, and decisions.

## Inputs

- Changed module or feature.
- Implementation summary.
- Test results.
- Architecture or ADR changes.

## Required Reading

- `docs/10-architecture/MODULE_BOUNDARIES.md`
- `docs/60-engineering/ENGINEERING_STANDARDS.md`
- `docs/ai/MODULE_DELIVERY_WORKFLOW.md`
- Relevant `docs/30-modules/<module>/MODULE.md`
- Relevant `docs/30-modules/<module>/TASKS.md`
- Relevant `docs/30-modules/<module>/TEST_PLAN.md`
- Relevant `docs/30-modules/<module>/DECISIONS.md`
- Relevant feature docs and ADRs.

## Output Files

- `docs/30-modules/<module>/MODULE.md`
- `docs/30-modules/<module>/TASKS.md`
- `docs/30-modules/<module>/TEST_PLAN.md`
- `docs/30-modules/<module>/DECISIONS.md`

## Process

1. Identify affected modules.
2. Confirm module memory is linked to feature delivery docs when the module is new or materially changed.
3. Update module purpose, responsibilities, non-responsibilities, public interfaces, and boundaries when behavior changes.
4. Update task status only when supported by completion evidence.
5. Update test expectations when risks or behavior change.
6. Record decisions or link ADRs when architecture changes.
7. Avoid copying full feature docs into module docs.

## Stop Conditions

Stop and request human decision if:

- Module ownership is unclear.
- A change crosses module boundaries without architecture review.
- Module memory updates would conflict with engineering standards.
- A decision belongs in an ADR instead of a module note.
- Feature delivery docs are missing for new module work.

## Quality Bar

- Module docs are concise and current.
- Boundaries are clear.
- Test expectations are actionable.
- Engineering standards that affect the module are reflected.
- Decisions link to ADRs where appropriate.
- Future agents can tell what the module owns and what it must not own.
