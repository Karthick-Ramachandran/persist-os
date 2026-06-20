# Recall OS Commands

This document records the Recall OS commands available to humans and AI agents.

## Completion Gate

Before claiming implementation work is complete, run:

```txt
pnpm test:run
pnpm typecheck
recall doctor
```

If `recall doctor` reports errors, fix them or report why they cannot be fixed. If it reports
warnings, address them or record why they are acceptable.

Package binary behavior is covered by binary integration tests.

## Commands

### `recall init`

Initialize neutral repository memory.

Options:

- `--preset <id>`: apply optional preset guidance and proposed decisions.
- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.
- `--reinit`: required with `--force` to overwrite an existing Recall OS installation (a directory
  that already has `.recall/config.json`). Without it, `--force` refuses, protecting existing
  repository memory.

Init also generates a tracked pre-commit hook at `.recall/hooks/pre-commit` that runs
`recall doctor` plus any `preCommitGates` in `.recall/config.json`. Init proposes, but does not run,
the activation command `git config core.hooksPath .recall/hooks`.

### `recall adopt`

Inspect an existing repository through read-only manifest and marker files, then write a proposed
adoption report and proposed framework ADRs for human review. Adopt never executes repository code
and never produces accepted memory.

Options:

- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.

### `recall skill create <name>`

Generate a portable AI agent skill as `SKILL.md` for both Claude Code (`.claude/skills/`) and the
portable Agent Skills target (`.agents/skills/`). Known names use the built-in catalog; unknown
names produce a valid skeleton. Generated skills contain no scripts.

Options:

- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.

### `recall skill list`

List the built-in catalog skills.

### `recall mcp add <server>`

Generate offline, proposed memory for an MCP server (for example `figma`) as
`docs/ai/mcp/<server>.md` plus a proposed adoption ADR. Recall OS never connects to the MCP server
or makes network calls; the agent records durable MCP-derived context into the generated memory for
human review.

Options:

- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.

### `recall preset list`

List built-in presets.

### `recall feature create <name>`

Create feature memory docs under the configured features directory.

Options:

- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.

### `recall adr create <title>`

Create a proposed ADR under the configured ADR directory.

Options:

- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.

### `recall module create <name>`

Create module memory docs under the configured modules directory.

Options:

- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.

### `recall doctor`

Check whether repository memory is structurally healthy enough for AI-assisted work, whether basic
engineering evidence is present, and whether memory references decisions that exist and are
accepted.

Doctor also runs deterministic drift checks: feature or module memory that references a missing ADR
is an error, and memory that references a not-yet-accepted ADR is a warning.

Exit codes:

- `0`: healthy
- `1`: warnings only
- `2`: errors
