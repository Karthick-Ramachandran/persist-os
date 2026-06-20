# Code Review Rules

## Purpose

Code review should verify that the change follows repository memory, not just that code appears to work.

## Review Priorities

Reviewers and AI review agents should check:

- Product requirements are satisfied.
- Accepted ADRs and repository decisions are respected.
- Architecture docs are not contradicted.
- Engineering standards are followed.
- Security assumptions are preserved.
- Tests prove meaningful behavior.
- Module boundaries remain clear.
- Docs changed when behavior changed.
- Completion evidence is present.

## Required Findings

Call out:

- Secret handling violations.
- Auth or authorization bypass.
- Undocumented dependency additions.
- Missing migrations or migration docs.
- File write safety regressions.
- Missing tests for risky behavior.
- Docs drift.
- Release blockers.

## Review Output

Findings should be:

- Specific.
- Actionable.
- Grounded in repository memory.
- Clear about severity.

Avoid vague feedback that does not name the violated rule or expected correction.

## Approval Standard

Do not approve a change that violates accepted repository memory unless the relevant docs, ADRs, or standards are updated and accepted.
