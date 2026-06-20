---
name: write-tests
description: Design and write meaningful tests from acceptance criteria, risk, security invariants, module boundaries, and regression history.
---

# Skill: Write Tests

## Purpose

Create professional tests that prove important behavior, not random happy paths.

## Inputs

- Feature PRD or task.
- Acceptance criteria.
- Changed files or planned modules.
- Known risks.

## Required Reading

- `docs/50-quality/TESTING_STRATEGY.md`
- `docs/50-quality/QUALITY_GATES.md`
- `docs/20-security/SECURITY_MODEL.md`
- `docs/10-architecture/MODULE_BOUNDARIES.md`
- `docs/60-engineering/ENGINEERING_STANDARDS.md`
- Relevant feature `TEST_PLAN.md`
- Relevant module `TEST_PLAN.md`

## Output Files

- Test files under the appropriate future `tests/` area.
- Updated `TEST_PLAN.md` when test strategy changes.
- Completion evidence listing commands and results.

## Process

1. Map acceptance criteria to test cases.
2. Add risk-based tests for unsafe paths, overwrites, symlinks, config validation, generated output, and CLI behavior as relevant.
3. Prefer unit tests for pure logic and integration tests for command behavior.
4. Add golden tests for generated docs and templates.
5. Name tests by behavior.
6. Document skipped tests and remaining risk.

## Stop Conditions

Stop and request human decision if:

- Requirements are not testable.
- The requested test would require runtime network, telemetry, cloud, MCP, or AI API behavior in MVP.
- Security-sensitive behavior lacks a documented expected result.
- The test approach conflicts with engineering standards.

## Quality Bar

- Tests derive from requirements and risk.
- Security invariants are covered.
- Test names describe behavior.
- Engineering standards for evidence and skipped checks are followed.
- Completion report includes commands and results.
