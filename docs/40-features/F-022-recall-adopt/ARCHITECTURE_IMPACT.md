# Architecture Impact: Recall Adopt

## Affected Modules

- `cli`: registers the `recall adopt` command.
- `adopt` (new): read-only repository inspection and proposed-memory generation.

Reuses `config`, `filesystem` (write pipeline), and the proposed-ADR rendering convention.

## New Behavior

- New `src/core/adopt/inspect-repo.ts` returns structured, read-only repository signals.
- New `src/core/adopt/generate-adoption.ts` turns signals into an adoption report and proposed ADRs.
- New `src/commands/adopt.ts` orchestrates inspection, planning, and non-destructive writes.
- `recall adopt` supports `--dry-run` and `--force`.

## Decision Records

- Governed by ADR-0003 (Recall Adopt Proposes, Never Accepts), which is accepted.

## Security Impact

- Inspection is strictly read-only: it reads manifest and marker files and never executes repository
  code, makes network calls, or installs dependencies.
- Writes reuse the safe pipeline: confined to the project root, symlink-protected, and
  non-destructive by default.
- Worst-case failure mode is an inaccurate proposal in a report, which a human reviews before
  accepting. No accepted memory is produced.

## Compatibility

- Works on repositories with or without existing Recall memory; default paths are used when no
  config is present.
- Adds a new `docs/adopt/` artifact and proposed ADRs; existing files are never overwritten by
  default.
