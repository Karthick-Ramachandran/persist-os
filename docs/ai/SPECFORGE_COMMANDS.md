# SpecForge Commands

This document records the SpecForge commands available to humans and AI agents.

## Completion Gate

Before claiming implementation work is complete, run:

```txt
pnpm test:run
pnpm typecheck
specforge doctor
```

If `specforge doctor` reports errors, fix them or report why they cannot be fixed.

Until package `bin` wiring exists in P10, this repository validates Doctor through `main(argv, io)` integration tests.

## Commands

### `specforge init`

Initialize neutral repository memory.

Options:

- `--preset <id>`: apply optional preset guidance and proposed decisions.
- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.

### `specforge feature create <name>`

Create feature memory docs under the configured features directory.

Options:

- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.

### `specforge adr create <title>`

Create a proposed ADR under the configured ADR directory.

Options:

- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.

### `specforge module create <name>`

Create module memory docs under the configured modules directory.

Options:

- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.

### `specforge doctor`

Check whether repository memory is structurally healthy enough for AI-assisted work.

Exit codes:

- `0`: healthy
- `1`: warnings only
- `2`: errors
