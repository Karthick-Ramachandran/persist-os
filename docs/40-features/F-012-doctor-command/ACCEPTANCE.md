# Acceptance Criteria: Doctor Command

## Command Behavior

- `doctor` runs through `main(argv, io)`.
- Doctor is read-only.
- Doctor reports findings grouped by `ERROR`, `WARNING`, and `INFO`.
- Doctor returns exit code `0` when healthy.
- Doctor returns exit code `1` when warnings exist and no errors exist.
- Doctor returns exit code `2` when errors exist.

## Config Checks

- Missing `.specforge/config.json` is an error.
- Invalid JSON config is an error.
- Schema-invalid config is an error.
- Configured `docsDir`, `featuresDir`, `modulesDir`, and `adrDir` must exist.

## Required File Checks

Required files include:

- `AGENTS.md`
- `CLAUDE.md`
- `docs/ai/SPECFORGE_COMMANDS.md`

Required docs include product, architecture, security, quality, engineering, AI/MCP, and ADR index docs.

## Memory Integrity Checks

- Valid feature folders contain required feature docs.
- Module folders contain `MODULE.md`, `TASKS.md`, `TEST_PLAN.md`, and `DECISIONS.md`.
- Valid ADR files contain required ADR sections.
- Malformed feature folders and malformed ADR files are ignored in P9 unless they block required docs.

## Init Command Memory

- `init` generates `docs/ai/SPECFORGE_COMMANDS.md`.
- Command reference lists `init`, `feature create`, `adr create`, `module create`, and `doctor`.
- Command reference documents the AI completion gate.

## Runtime Boundary

- No files are written by Doctor.
- No network, telemetry, MCP runtime, AI API, cloud behavior, package binary wiring, JSON reporter, or auto-fix behavior is added.
