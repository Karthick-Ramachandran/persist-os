# Architecture Drift Review

## Definition

Architecture drift is undocumented change, mismatch with accepted repository memory, or mismatch with accepted engineering standards.

Change is acceptable when the docs are updated. Drift happens when code, dependencies, security posture, module boundaries, or generated behavior change without source-of-truth updates.

Drift is not difference from a SpecForge recommendation.

SpecForge is architecture-neutral. Redis, Kafka, CloudWatch, Datadog, Supabase, Firebase, and internal systems are all valid when accepted by repository or organization memory.

## Review Areas

- Product behavior changed without PRD or change request update.
- Architecture changed without architecture doc or ADR update.
- Engineering standards were violated or bypassed.
- Dependency added without dependency policy review.
- File write behavior changed without file write policy update.
- Module boundary changed without module docs update.
- Security-sensitive behavior changed without security review.
- Generated output changed without golden test review.
- Tests missing for changed risk.

## Stop Conditions

Stop and request human decision if:

- Implementation conflicts with an accepted ADR.
- Implementation conflicts with engineering standards.
- New dependency is added without ADR consideration.
- Network, telemetry, auth, secrets, storage, or file write behavior changes without security review.
- Feature behavior changes without PRD or change request update.

## Output

Write drift findings into the relevant feature `REVIEW.md` or completion report.
