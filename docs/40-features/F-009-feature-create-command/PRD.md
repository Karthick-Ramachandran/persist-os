# PRD: Feature Create Command

## Purpose

Implement `specforge feature create <name>` so users can create feature memory before implementation work starts.

P6 turns the feature delivery workflow into a command.

## Problem

SpecForge can initialize repository memory, but it cannot yet create repeatable feature folders.

Without feature-create support, users and agents can skip PRD, acceptance, architecture impact, test plan, tasks, review, and completion evidence.

## Decision

P6 adds a feature create command that creates a complete, concise feature memory folder.

Feature docs are starter memory. Humans and agents fill in the substance after creation.

## In Scope

- Feature name slugging.
- Feature number scanning.
- Feature document generation.
- CLI command wiring for `feature create <name>`.
- Config-based feature directory selection.
- Safe write planning and execution.
- `--dry-run`.
- `--force`.
- Unit and integration tests.

## Non-Goals

- AI-written PRDs.
- ADR create command.
- Module create command.
- Doctor command.
- Package `bin` or release wiring.
- Technology detection.
- Rich templates.
- Network, telemetry, MCP runtime, AI API, cloud behavior, or production app code.

## Success Criteria

- Command requires initialized SpecForge config.
- Command creates `F-###-<slug>` feature folders.
- Numbering starts at `F-001`.
- Numbering increments from valid existing feature folders.
- Re-running the same feature slug targets the existing feature folder instead of creating duplicate feature memory.
- Malformed feature folders are ignored.
- Unsafe names are rejected.
- Existing files are skipped by default.
- Dry run writes nothing.
- Force overwrites explicitly.
