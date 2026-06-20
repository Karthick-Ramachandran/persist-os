# Tasks: Doctor Command

## T0: Add P9 Docs And Module Memory

Status: Done

Scope:

- `docs/40-features/F-012-doctor-command/`
- `docs/30-modules/doctor/`
- related module memory

Acceptance:

- Doctor feature docs exist.
- Doctor module memory exists.

## T1: Add Command Reference Memory

Status: Done

Scope:

- init generated docs
- root agent files
- repository init and agent-rules memory

Acceptance:

- Init generates `docs/ai/SPECFORGE_COMMANDS.md`.
- Command reference documents current SpecForge commands and Doctor completion gate.

## T2: Implement Doctor Core

Status: Done

Scope:

- `src/core/doctor/`

Acceptance:

- Doctor report types exist.
- Doctor checks config, required docs, configured dirs, feature docs, module docs, and ADR sections.
- Doctor is read-only.

## T3: Implement Doctor Command And CLI Wiring

Status: Done

Scope:

- `src/commands/doctor.ts`
- `src/cli/main.ts`

Acceptance:

- `doctor` works through `main(argv, io)`.
- Exit code is `0`, `1`, or `2` based on report severity.
- Output is grouped and actionable.

## T4: Add Tests

Status: Done

Scope:

- `tests/unit/doctor/doctor-report.test.ts`
- `tests/unit/doctor/doctor-checks.test.ts`
- `tests/integration/doctor-command.test.ts`
- init golden tests

Acceptance:

- Unit and integration tests cover P9 acceptance criteria.

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
