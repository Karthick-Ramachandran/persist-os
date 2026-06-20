---
name: plan-feature
description: Plan a feature from approved requirements by producing implementation tasks, architecture impact, test plan, review expectations, and completion evidence. Use when turning an approved PRD into a plan, tasks, and a test plan.
---

# Skill: Plan Feature

## Purpose

Turn product intent into a scoped engineering plan that an implementation agent can follow safely.

## Inputs

- Feature PRD.
- Acceptance criteria.
- Relevant module or architecture docs.
- Known constraints or release target.

## Required Reading

- `docs/10-architecture/ARCHITECTURE.md`
- `docs/10-architecture/FILE_WRITE_POLICY.md`
- `docs/20-security/SECURITY_MODEL.md`
- `docs/50-quality/QUALITY_GATES.md`
- `docs/60-engineering/ENGINEERING_STANDARDS.md`
- Relevant feature docs under `docs/40-features/`
- Relevant module docs under `docs/30-modules/`
- Relevant ADRs under `docs/adrs/`

## Output Files

- `docs/40-features/<feature>/PLAN.md`
- `docs/40-features/<feature>/TASKS.md`
- `docs/40-features/<feature>/ARCHITECTURE_IMPACT.md`
- `docs/40-features/<feature>/TEST_PLAN.md`

## Process

1. Restate the feature objective and acceptance criteria.
2. Identify modules, docs, templates, and tests affected.
3. Document architecture impact and ADR needs.
4. Break work into ordered tasks with clear completion evidence.
5. Define tests from requirements, risk, security invariants, and regressions.
6. For module requests, treat the module as a mini product and create feature delivery docs before implementation tasks.

## Stop Conditions

Stop and request human decision if:

- Requirements are missing or contradictory.
- Architecture impact cannot be determined.
- The plan conflicts with engineering standards.
- A task requires changing MVP non-goals.
- A module request tries to start implementation before PRD, acceptance, architecture impact, test plan, and tasks exist.

## Quality Bar

- Tasks are ordered and independently reviewable.
- Tests map to acceptance criteria and risks.
- Architecture impact is explicit.
- Engineering standards are accounted for in tasks and completion evidence.
- The plan does not include implementation code when only planning is requested.
