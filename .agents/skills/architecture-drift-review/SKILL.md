---
name: architecture-drift-review
description: Review a change for undocumented architecture, dependency, module, security, testing, or documentation drift. Use when checking whether a change diverges from accepted repository memory.
---

# Skill: Architecture Drift Review

## Purpose

Find changes that diverge from accepted repository memory.

Drift is not difference from a Recall OS recommendation. Recall OS is architecture-neutral.

## Inputs

- Change summary or diff.
- Feature docs.
- Module docs.
- ADRs.
- Test results.

## Required Reading

- `docs/10-architecture/ARCHITECTURE.md`
- `docs/60-engineering/ENGINEERING_STANDARDS.md`
- `docs/20-security/SECURITY_MODEL.md`
- Relevant `docs/30-modules/<module>/MODULE.md`
- Relevant `docs/40-features/<feature>/PRD.md`
- Relevant `docs/adrs/*.md`

## Output Files

- Relevant feature `REVIEW.md`
- Relevant feature `COMPLETION_REPORT.md`
- Updated docs only when the human accepts documented evolution.

## Process

1. Review the change and identify changed modules and generated outputs.
2. Compare changes against accepted ADRs and repository decisions.
3. Compare changes against module boundaries.
4. Check for new dependencies and security-sensitive changes.
5. Check whether tests and docs were updated.
6. Classify findings.

## Finding Types

- Architecture drift
- Dependency drift
- Module drift
- Security drift
- Testing drift
- Documentation drift
- Engineering standards drift
- Acceptable documented evolution

## Stop Conditions

Stop and request human decision if:

- An accepted ADR conflicts with the implementation.
- The implementation conflicts with engineering standards.
- A dependency was added without ADR consideration.
- Authentication, authorization, storage, networking, secrets, telemetry, cloud, runtime MCP, or file write behavior changed without security review.
- Feature behavior changed without a PRD or change request update.

## Quality Bar

- Findings distinguish drift from documented evolution.
- Findings compare against accepted repository memory, not Recall OS preferences.
- Each blocker names the missing source-of-truth update.
- Review output is concrete enough to act on.
