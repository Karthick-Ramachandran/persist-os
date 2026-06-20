# Tasks: Preset System

## T0: Add P4 Docs And Module Memory

Status: Done

Scope:

- `docs/40-features/F-007-preset-system/`
- `docs/30-modules/presets/`
- `docs/30-modules/opinion-packs/`

Acceptance:

- Feature delivery docs exist.
- Preset module memory exists.
- Opinion-pack memory points to P4 implementation work.

## T1: Implement Preset Schema And Validation

Status: Done

Scope:

- `src/core/presets/preset-schema.ts`
- `src/core/presets/validate-preset.ts`

Acceptance:

- Preset objects are strict.
- Destination paths are normalized and safe.
- Duplicate normalized destinations are rejected.
- Accepted decisions are rejected.

## T2: Implement Built-In Registry

Status: Done

Scope:

- `src/core/presets/preset-registry.ts`
- `src/presets/*/preset.ts`

Acceptance:

- Built-in presets validate through public validation.
- `listPresets()` is deterministic.
- `getPreset(id)` handles known and missing IDs.

## T3: Add Tests

Status: Done

Scope:

- `tests/unit/presets/preset-schema.test.ts`
- `tests/unit/presets/validate-preset.test.ts`

Acceptance:

- Tests cover built-ins, unsafe inputs, duplicate destinations, accepted decisions, unknown keys, and registry behavior.

## T4: Verify And Complete

Status: Done

Scope:

- Automated checks.
- Manual docs review.
- Drift and security review.
- Completion report.

Acceptance:

- `pnpm test:run` passes.
- `pnpm typecheck` passes.
- No runtime scope beyond preset contracts changed.
