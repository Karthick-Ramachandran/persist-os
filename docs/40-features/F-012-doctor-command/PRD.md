# PRD: Doctor Command

## Purpose

Implement `specforge doctor` so SpecForge can validate whether repository memory is healthy enough for AI-assisted work.

P9 turns SpecForge from only creating memory into also protecting memory.

## Problem

SpecForge can create repository, feature, ADR, and module memory, but it cannot yet verify whether that memory remains structurally healthy.

Without Doctor, AI agents and humans can claim completion while required repository memory is missing, invalid, or incomplete.

## Decision

P9 adds a read-only Doctor command.

Doctor validates config, required files, required docs, and generated memory structure.

P9 also adds generated command-reference memory so agents can discover how to use SpecForge from repository docs.

## In Scope

- `specforge doctor` command.
- Doctor severity model: `error`, `warning`, `info`.
- Exit codes: `0` healthy, `1` warnings only, `2` errors.
- Config existence, JSON parsing, and schema validation checks.
- Required root, AI, product, architecture, security, quality, engineering, and ADR index docs.
- Required configured directories.
- Feature folder required docs.
- Module folder required docs.
- ADR required sections.
- Generated `docs/ai/SPECFORGE_COMMANDS.md`.
- Agent instruction updates that describe Doctor as an AI completion gate.
- Unit and integration tests.

## Non-Goals

- Accepted ADR drift detection.
- Code-to-module ownership drift.
- Dependency drift.
- Stale completion content detection.
- JSON reporter.
- Auto-fix behavior.
- Package `bin` or release wiring.
- Network, telemetry, MCP runtime, AI API, cloud behavior, or production app code.

## Success Criteria

- Healthy initialized repositories pass Doctor.
- Missing config fails Doctor.
- Invalid config fails Doctor.
- Missing root, AI, baseline docs, configured dirs, feature docs, module docs, or ADR sections fail Doctor.
- Doctor output is grouped by severity and actionable.
- Doctor returns `0`, `1`, or `2` based on findings.
- Init generates local command-reference memory.
- Root agent files document Doctor as a completion gate.
