---
name: completion-report
description: Write a completion report with files changed, tests run, results, skipped checks, docs updated, remaining risks, and release readiness notes.
---

# Skill: Completion Report

## Purpose

Record evidence that a task is complete and safe to review.

## Inputs

- Task or feature summary.
- Files changed.
- Commands run.
- Test results.
- Docs updated.
- Known risks.

## Required Reading

- `docs/50-quality/DEFINITION_OF_DONE.md`
- `docs/50-quality/QUALITY_GATES.md`
- `docs/60-engineering/ENGINEERING_STANDARDS.md`
- Relevant feature `TASKS.md`
- Relevant feature `TEST_PLAN.md`
- Relevant feature `REVIEW.md`

## Output Files

- Relevant feature `COMPLETION_REPORT.md`
- Task or feature docs that need final status updates.

## Process

1. Summarize the completed scope.
2. List files changed by category.
3. List commands run and results.
4. List skipped checks and why.
5. List docs updated.
6. State whether engineering standards were followed.
7. List remaining risks and follow-up work.
8. State whether the task meets the definition of done.

## Stop Conditions

Stop and request human decision if:

- Test results are missing for risky changes.
- Completion claims conflict with evidence.
- Required docs were not updated.
- Engineering standards were violated.
- Remaining risks are release blockers.

## Quality Bar

- The report is evidence-based.
- It does not hide skipped checks.
- It separates completed work from remaining risk.
- It states whether engineering standards were followed.
- A reviewer can decide what to do next from the report alone.
