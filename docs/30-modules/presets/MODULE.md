# Module: Presets

## Purpose

The presets module owns the runtime contract for optional opinion packs.

It validates preset definitions and exposes built-in preset registry access for future commands.

## Owns

- Preset schema.
- Preset validation.
- Built-in preset registry.
- Safe destination validation for preset outputs.
- Proposed decision status enforcement.

## Does Not Own

- Accepted repository decisions.
- Organization memory.
- CLI command parsing.
- Init command orchestration.
- Template file loading.
- File write execution.
- Rich framework knowledge bases in P4.
- Runtime MCP, network, telemetry, cloud, or AI API behavior.

## Public Interfaces

- `Preset`
- `PresetTemplate`
- `PresetGuidance`
- `PresetProposedDecision`
- `PresetValidationError`
- `parsePreset`
- `validatePreset`
- `validatePresetRegistry`
- `listPresets`
- `getPreset`

## Boundaries

Presets may suggest. Presets must not silently decide.

Any decision-like content in a preset must remain proposed until a human accepts it in repository memory.
