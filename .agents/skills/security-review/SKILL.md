---
name: security-review
description: Review a change for file write safety, path traversal, symlink risk, overwrite behavior, dependencies, secrets, telemetry, network, MCP, and supply chain risk. Use when reviewing a change for security before it is accepted.
---

# Skill: Security Review

## Purpose

Find security risks before a change is accepted.

## Inputs

- Change summary or diff.
- Feature docs.
- Architecture and security docs.
- Test results.

## Required Reading

- `docs/20-security/SECURITY_MODEL.md`
- `docs/20-security/THREAT_MODEL.md`
- `docs/10-architecture/FILE_WRITE_POLICY.md`
- `docs/60-engineering/ENGINEERING_STANDARDS.md`
- `docs/ai/MCP_STRATEGY.md`

## Output Files

- Relevant feature `REVIEW.md`
- Relevant feature `COMPLETION_REPORT.md`
- Security docs, if the accepted behavior changes.

## Process

1. Identify changed trust boundaries.
2. Check path validation, overwrite policy, symlink policy, and dry-run behavior.
3. Check dependency, package, template, and preset risk.
4. Check for network, telemetry, secrets, `.env`, cloud, AI API, or runtime MCP behavior.
5. Check tests for security-sensitive behavior.
6. Classify findings as blockers, risks, or documented acceptable tradeoffs.

## Stop Conditions

Stop and request human decision if:

- Runtime network, telemetry, cloud, MCP, AI API, auth, secrets, storage, or file write behavior changes without ADR or security review.
- Existing files can be overwritten by default.
- Writes can escape the project root.
- Secrets could be read, logged, or generated into docs.
- Engineering standards are bypassed for secrets, dependencies, migrations, tests, or completion evidence.

## Quality Bar

- Findings are specific and actionable.
- Security claims cite docs or test evidence.
- Remaining risks are explicit.
