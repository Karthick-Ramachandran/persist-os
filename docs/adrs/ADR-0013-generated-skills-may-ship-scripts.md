# ADR-0013: Generated Skills May Ship Scripts

## Status

Accepted

## Supersedes

- ADR-0004-skill-generation-portable-and-scriptless

## Context

ADR-0004 recorded the MVP rule that generated skills are inert markdown. ADR-0012
reverses that rule because the scriptless constraint forces deterministic operations
into prose, costing context on every activation for worse results. This ADR is the
accepted record of the changed decision.

## Decision

Generated skills may ship a scripts directory under the four constraints recorded in
ADR-0012: scripts are opt-in per skill with init naming the executables written;
scripts stay read-only and local; every skill works when its scripts are deleted;
scripts travel through the same safe write pipeline as all generated files.

## Alternatives Considered

Keep the rule and put deterministic work in subcommands instead: partly adopted
already, rejected as a complete answer because it makes user-authored skills
second-class. Scripts only in user-authored skills: rejected, since it gives shipped
skills less scrutiny than hand-written ones. Keep the rule unchanged: rejected, as
it is the largest remaining source of avoidable context cost.

## Consequences

Deterministic skill work executes instead of being re-derived, and skill quality
becomes testable. Init can now write executable files, which the README and the
security model state plainly. The remaining risk is scope creep into networked or
state-mutating scripts; the four constraints carry failing tests as the guard.

## Related Documents

- Supersedes: [ADR-0004](ADR-0004-skill-generation-portable-and-scriptless.md)
- Related: [ADR-0008](ADR-0008-skill-architecture-progressive-disclosure.md),
  [ADR-0012](ADR-0012-generated-skills-may-ship-scripts.md)
- Feature: `docs/40-features/F-035-skills-v2/`
