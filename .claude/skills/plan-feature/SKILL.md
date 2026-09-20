---
name: plan-feature
description: "Turn approved requirements into an implementation plan with tasks and a test plan. Use when planning a substantial feature from approved requirements before any implementation begins. Skip for small local changes (implement directly with focused tests), security reviews, and convention checks."
---

# Goal

Turn approved requirements into an ordered implementation plan without writing implementation code.

## Inputs

- Approved requirements or feature PRD.
- Acceptance criteria.
- Known constraints or release target.

## Workflow

1. Restate the objective and acceptance criteria in one paragraph.
2. Identify the affected modules, docs, templates, and tests.
3. Record architecture impact and whether a new ADR is needed (propose it; never accept it yourself).
4. Break the work into ordered tasks, each with explicit completion evidence.
5. Derive the test plan from acceptance criteria, risks, and likely regressions.
6. Stop before implementation and hand back the PLAN, TASKS, and TEST_PLAN paths.

## Decisions

- If requirements are missing or contradictory → stop and ask for them.
- If a task would change accepted non-goals → stop and ask for approval.
- If the request is a small local fix → skip this skill and implement directly with focused tests.

## Verification

- PLAN.md states the objective, scope, and architecture impact.
- Every task maps to an acceptance criterion or a stated risk.
- No implementation code was written.

## Resources

- For completion evidence rules → docs/50-quality/QUALITY_GATES.md
- For engineering rules → docs/60-engineering/ENGINEERING_STANDARDS.md
- For sensitive scope → docs/20-security/SECURITY_MODEL.md
- For prior decisions → docs/adrs/

## Output

- Paths of the PLAN.md, TASKS.md, and TEST_PLAN.md files written.
- One-paragraph summary of scope and the recommended first task.

