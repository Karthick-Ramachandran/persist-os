# Tasks: Feature Create Command

## T0: Add P6 Docs And Module Memory

Status: Done

Scope:

- `docs/40-features/F-009-feature-create-command/`
- `docs/30-modules/feature-workflow/`
- related module memory

Acceptance:

- Feature delivery docs exist.
- Feature-workflow module memory exists.

## T1: Implement Feature Numbering

Status: Done

Scope:

- `src/core/naming/feature-number.ts`

Acceptance:

- Starts at `F-001`.
- Increments from valid existing feature folders.
- Reuses an existing valid folder for the same feature slug.
- Ignores malformed folders.

## T2: Implement Feature Generation

Status: Done

Scope:

- `src/core/generator/generate-feature.ts`

Acceptance:

- Generates all required feature docs.
- Returns write inputs only.
- Does not write files.

## T3: Implement Feature Command And CLI Wiring

Status: Done

Scope:

- `src/commands/feature/create.ts`
- `src/cli/main.ts`

Acceptance:

- `feature create <name>` works through `main(argv, io)`.
- Missing config and unsafe names fail clearly.
- Dry run and force route through safe write planning.

## T4: Add Tests

Status: Done

Scope:

- `tests/unit/naming/feature-number.test.ts`
- `tests/unit/generator/generate-feature.test.ts`
- `tests/integration/feature-create-command.test.ts`

Acceptance:

- Unit and integration tests cover P6 acceptance criteria.

## T5: Verify And Complete

Status: Done

Scope:

- Automated checks.
- Manual docs review.
- Drift and security review.
- Completion report.

Acceptance:

- `pnpm test:run` passes.
- `pnpm typecheck` passes.
- Completion evidence is recorded.
