# Tasks: Module Create Command

## T0: Add P8 Docs And Module Memory

Status: Done

Scope:

- `docs/40-features/F-011-module-create-command/`
- `docs/30-modules/module-workflow/`
- related module memory

Acceptance:

- Module create feature docs exist.
- Module-workflow module memory exists.

## T1: Extract Shared Write Summary Helper

Status: Done

Scope:

- command output helper
- existing init, feature create, and ADR create output formatting

Acceptance:

- Existing command output behavior remains unchanged.
- No config or error handling refactor is included.

## T2: Implement Module Generation

Status: Done

Scope:

- `src/core/generator/generate-module.ts`

Acceptance:

- Generates all required module docs.
- Returns write inputs only.
- Does not write files.

## T3: Implement Module Command And CLI Wiring

Status: Done

Scope:

- `src/commands/module/create.ts`
- `src/cli/main.ts`

Acceptance:

- `module create <name>` works through `main(argv, io)`.
- Missing config and unsafe names fail clearly.
- Dry run and force route through safe write planning.

## T4: Add Tests

Status: Done

Scope:

- `tests/unit/generator/generate-module.test.ts`
- `tests/integration/module-create-command.test.ts`

Acceptance:

- Unit and integration tests cover P8 acceptance criteria.

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
- `git diff --check` passes.
- Completion evidence is recorded.
