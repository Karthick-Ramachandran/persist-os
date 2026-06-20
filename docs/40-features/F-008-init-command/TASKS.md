# Tasks: Init Command

## T0: Add P5 Docs And Module Memory

Status: Done

Scope:

- `docs/40-features/F-008-init-command/`
- `docs/30-modules/cli/`
- repository init and generator module memory

Acceptance:

- Feature delivery docs exist.
- CLI module memory exists.
- Init-related module memory points to P5.

## T1: Add Commander Dependency

Status: Done

Scope:

- `package.json`
- `pnpm-lock.yaml`

Acceptance:

- Commander is installed through pnpm.
- No other dependency is added.

## T2: Implement Init Generation

Status: Done

Scope:

- `src/core/generator/`

Acceptance:

- Neutral memory file plan is deterministic.
- Preset output is optional guidance and proposed decisions only.
- No file loading or writing happens in generator code.

## T3: Implement Init Command And CLI Parser

Status: Done

Scope:

- `src/commands/init.ts`
- `src/cli/`

Acceptance:

- `main(argv, io)` can run `init`.
- Unknown presets fail clearly.
- Dry run and force behavior route through safe write planning.

## T4: Add Tests

Status: Done

Scope:

- `tests/integration/init-command.test.ts`
- `tests/golden/`

Acceptance:

- Integration and golden tests cover required P5 behavior.

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
