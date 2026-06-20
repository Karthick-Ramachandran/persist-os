# Acceptance Criteria: Preset System

## Schema

- Preset IDs use lowercase letters, numbers, and single hyphens.
- Unknown keys are rejected at every preset object level.
- Template destinations are safe relative paths.
- Proposed decision destinations are safe relative paths.
- Duplicate normalized destinations are rejected.
- Proposed decisions must have `status: "proposed"`.
- `status: "accepted"` is rejected in presets.

## Registry

- Built-in presets exist for `generic`, `nextjs`, `ios-swift`, and `flutter`.
- Built-in presets validate through the same public validation path as user-provided presets.
- `listPresets()` returns presets in deterministic order.
- `getPreset(id)` returns the matching preset or `undefined` for a missing preset.

## Runtime Boundary

- No CLI command is implemented.
- No init flow is implemented.
- No files are generated or written.
- No template files are loaded.
- No dependency is added.
- No network, telemetry, MCP runtime, AI API, or cloud behavior is added.

## Opinion-Pack Boundary

- Presets provide guidance and proposed decisions only.
- Presets do not create accepted repository decisions.
- Presets do not override accepted repository memory or organization memory.
