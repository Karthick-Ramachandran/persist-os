# Review: Engineering Conventions Memory

## Status

Reviewed — no blocking findings.

## Findings

- Scope stayed architecture-neutral: the new docs are empty neutral scaffolds; no stack opinions, no
  runtime behavior, no network/telemetry.
- The gate stays structural (stub nudge only) and the semantic reuse-vs-reinvent judgment lives in
  the `conventions-adherence` skill, consistent with the gate-is-dumb / agent-is-smart split.
- `LESSONS.md` deliberately has no doctor check (an empty lessons file is valid for a new repo).
- A bare `persist init` stays green; the conventions nudge only fires once the repository has real
  work, matching the existing security-doc content check.
- Non-blocking follow-up: regenerate the stale `examples/generated-*` in a separate change.
