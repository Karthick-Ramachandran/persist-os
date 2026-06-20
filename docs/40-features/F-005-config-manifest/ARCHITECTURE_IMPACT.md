# Architecture Impact: Config Manifest

## Summary

P2 adds `core/config` as a new core module.

The module owns `.specforge/config.json` schema, defaults, loading, and writing.

## Dependency Impact

P2 adds `zod` as a production dependency.

This matches the documented MVP stack and is used only for local schema validation.

## Module Impact

`core/config` may depend on:

- `core/filesystem` for safe path normalization and safe writes.
- Node built-ins for reading config files.
- Zod for validation.

`core/config` must not depend on:

- CLI command implementations.
- Preset runtime.
- Template rendering.
- Network, telemetry, MCP, or AI APIs.

## Security Impact

Config is a trust boundary.

P2 must:

- Reject unknown keys.
- Reject unsafe relative paths.
- Reject invalid JSON.
- Avoid storing secrets.
- Write through the existing safe write pipeline.
- Skip existing config by default.

## ADR Need

No ADR is required for P2.

Zod is already listed in the accepted MVP tech stack. P2 does not add network behavior, telemetry, MCP runtime, template execution, or a new preset/plugin execution model.
