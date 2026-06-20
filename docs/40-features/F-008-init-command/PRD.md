# PRD: Init Command

## Purpose

Implement `specforge init` as the first real product workflow.

The command initializes repository memory. It does not generate application code.

## Problem

SpecForge has safe writes, config, rendering, and presets, but users cannot yet initialize a repository memory structure through a command.

P5 connects those foundations into a minimal, useful init flow.

## Decision

P5 adds testable Commander-based CLI wiring and init orchestration.

Package `bin`, build, release, and npm publish wiring are deferred to release work so P5 does not introduce a broken binary.

## In Scope

- `init` command parser wiring.
- Programmatic `main(argv, io)` entrypoint for tests.
- Neutral repository memory generation.
- Optional preset guidance and proposed decisions.
- Combined safe write plan for config and generated docs.
- `--dry-run`.
- `--force`.
- Unknown preset errors.
- Empty-folder and non-Git init behavior.
- Integration and golden tests.

## Non-Goals

- Package `bin`.
- Build pipeline.
- Release workflow.
- `preset list`.
- Technology detection.
- Template file loading.
- Runtime MCP.
- Network calls.
- Telemetry.
- AI API calls.
- Production application code generation.

## Success Criteria

- `init` creates config and minimal memory docs in an empty folder.
- `init` does not require Git or existing app files.
- Neutral init has no architecture or technology choices.
- Preset init adds optional guidance and proposed decisions only.
- Existing files are skipped by default.
- `--dry-run` writes nothing and reports planned writes.
- `--force` overwrites explicitly.
- Unknown presets fail clearly and write nothing.
