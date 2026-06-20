---
name: architecture-drift-review
description: Review a change for undocumented architecture, dependency, module, security, testing, or documentation drift.
---

# Skill: Architecture Drift Review

## Purpose

Find changes that diverge from accepted repository memory.

Drift is not difference from a SpecForge recommendation. SpecForge is architecture-neutral.

## Inputs

- Change summary or diff.
- Feature docs.
- Module docs.
- ADRs.
- Test results.

## Required Reading

- `docs/10-architecture/ARCHITECTURE.md`
- `docs/10-architecture/MODULE_BOUNDARIES.md`
- `docs/10-architecture/DEPENDENCY_POLICY.md`
- `docs/60-engineering/ENGINEERING_STANDARDS.md`
- `docs/20-security/SECURITY_MODEL.md`
- `docs/50-quality/ARCHITECTURE_DRIFT_CHECKLIST.md`
- Relevant `docs/30-modules/<module>/MODULE.md`
- Relevant `docs/40-features/<feature>/PRD.md`
- Relevant `docs/adrs/*.md`
- `docs/10-architecture/MEMORY_ENGINE.md`
- `docs/10-architecture/REPOSITORY_DECISIONS.md`

## Output Files

- Relevant feature `REVIEW.md`
- Relevant feature `COMPLETION_REPORT.md`
- Updated docs only when the human accepts documented evolution.

## Process

1. Review the change.
2. Identify changed modules and generated outputs.
3. Compare changes against accepted ADRs and repository decisions.
4. Compare changes against module boundaries.
5. Check for new dependencies.
6. Check for security-sensitive changes.
7. Check whether tests were updated.
8. Check whether docs were updated.
9. Classify findings.

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
- Feature behavior changed without PRD or change request update.

## Quality Bar

- Findings distinguish drift from documented evolution.
- Findings compare against accepted repository memory, not SpecForge preferences.
- Findings include engineering standards violations.
- Each blocker names the missing source-of-truth update.
- Review output is concrete enough to act on.
