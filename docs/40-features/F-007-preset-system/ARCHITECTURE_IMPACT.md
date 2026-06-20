# Architecture Impact: Preset System

## Affected Modules

- `core/presets`
- `src/presets/*`

## New Module Behavior

`core/presets` owns preset schema, validation, registry access, and built-in preset contract checks.

Built-in preset content is intentionally minimal. P4 validates the model before expanding ecosystem-specific guidance.

## ADR Impact

No new ADR is required.

The accepted architecture-neutral memory model already defines presets as optional opinion packs. P4 implements that model without changing the runtime trust boundary.

## Dependency Impact

No dependency is added.

P4 reuses Zod and existing safe path normalization.

## Security Impact

Preset definitions become a trust boundary.

P4 mitigates preset risk by requiring strict schema validation, safe relative destinations, duplicate destination checks, and proposed-only decisions.

## File Write Impact

No file write behavior changes.

P4 validates output destinations but does not write files. Future commands must pass generated outputs through `core/filesystem`.
