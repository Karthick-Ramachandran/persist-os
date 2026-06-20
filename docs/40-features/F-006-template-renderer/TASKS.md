# Tasks: Template Renderer

## T0: Add P3 Docs And Module Memory

Status: Done

Scope:

- `docs/40-features/F-006-template-renderer/`
- `docs/30-modules/generator/`

Acceptance:

- Feature delivery docs exist.
- Generator module memory exists.

## T1: Add Placeholder Renderer ADR

Status: Done

Scope:

- `docs/adrs/ADR-0001-deterministic-placeholder-renderer.md`

Acceptance:

- ADR records placeholder-only rendering as accepted.
- Eta and advanced templating are deferred.

## T2: Implement Template Context

Status: Done

Scope:

- `src/core/generator/template-context.ts`

Acceptance:

- Context keys are validated.
- Invalid keys and prototype-adjacent keys are rejected.
- Only string, number, and boolean values are accepted.

## T3: Implement Template Rendering

Status: Done

Scope:

- `src/core/generator/render-template.ts`

Acceptance:

- Placeholders render deterministically.
- Missing values and invalid placeholders fail clearly.
- Logic and execution syntax are rejected.
- Renderer performs no file reads or writes.

## T4: Add Tests

Status: Done

Scope:

- `tests/unit/generator/render-template.test.ts`

Acceptance:

- Unit tests cover valid rendering, validation failures, unsafe syntax, and prototype-adjacent keys.

## T5: Update Docs And Complete Review

Status: Done

Scope:

- Product and architecture docs.
- `REVIEW.md`
- `COMPLETION_REPORT.md`

Acceptance:

- Eta references are corrected.
- Verification passes.
- Completion evidence is recorded.
