# Acceptance Criteria: Strategic Reframe

## Positioning

- Product docs describe SpecForge as an architecture-neutral memory engine.
- Product docs do not imply SpecForge chooses Redis, Kafka, Supabase, Datadog, Auth0, Postgres, or similar technology choices.
- `specforge init` is documented as the neutral default path.

## Presets

- `preset` remains the CLI/user-facing term.
- Presets are defined architecturally as opinion packs.
- Preset suggestions are optional guidance or proposed ADRs.
- Presets must not silently create accepted architecture decisions.

## Memory Layers

- Memory Engine is documented.
- Repository Decisions are documented.
- Opinion Packs are documented.
- Organization Memory is documented.

## Drift

- Drift is defined as mismatch with accepted repository memory.
- Drift is not defined as mismatch with a SpecForge recommendation.

## Scope

- No runtime behavior changes.
- Existing tests and typecheck still pass.
