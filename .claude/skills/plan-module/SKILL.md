---
name: plan-module
description: Plan a module as a mini product by creating feature delivery docs, module memory, acceptance criteria, architecture impact, test plan, and ordered tasks before implementation. Use when asked to build, create, redesign, or materially change a module.
---

# Skill: Plan Module

## Purpose

Turn a module request into a complete delivery workflow before implementation starts.

## Inputs

- Module name or request.
- Product goal or user need.
- Existing architecture, feature, or module docs.
- Known constraints or priority stage.

## Required Reading

- `AGENTS.md`
- `docs/00-product/PRD.md`
- `docs/10-architecture/ARCHITECTURE.md`
- `docs/20-security/SECURITY_MODEL.md`
- `docs/50-quality/TESTING_STRATEGY.md`
- `docs/60-engineering/ENGINEERING_STANDARDS.md`
- `docs/ai/MODULE_DELIVERY_WORKFLOW.md`
- Relevant ADRs under `docs/adrs/`

## Output Files

- `docs/40-features/F-###-<module>-module/` delivery docs (PRD, ACCEPTANCE, ARCHITECTURE_IMPACT, PLAN, TASKS, TEST_PLAN, REVIEW, COMPLETION_REPORT).
- `docs/30-modules/<module>/MODULE.md`
- `docs/30-modules/<module>/TASKS.md`
- `docs/30-modules/<module>/TEST_PLAN.md`
- `docs/30-modules/<module>/DECISIONS.md`

## Process

1. Create a module brief: ownership, non-ownership, public interfaces, users, and use cases.
2. Define behavior and edge cases.
3. Write testable acceptance criteria.
4. Document architecture impact, dependency impact, config impact, template impact, and ADR needs.
5. Write the test plan from acceptance criteria, security invariants, and regression risk.
6. Break work into ordered tasks with status, scope, acceptance, tests, and do-not-do boundaries.
7. Mark implementation as blocked until the first task is selected.

## Stop Conditions

Stop and request human decision if:

- The module ownership or public interface is unclear.
- The module conflicts with accepted ADRs or architecture docs.
- The module conflicts with engineering standards.
- The module requires runtime network, telemetry, cloud, MCP, AI API, auth, secrets, storage, or file write behavior changes without ADR or security review.
- The user asks to implement before PRD, acceptance, architecture impact, test plan, and tasks exist.

## Quality Bar

- The module is planned as a mini product, not a file list.
- PRD, acceptance, architecture impact, test plan, and tasks are all present.
- Tasks are small enough to execute one at a time.
- Module memory captures what future agents need to remember.
- No implementation code is written by this skill.
