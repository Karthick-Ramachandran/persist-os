# Acceptance Criteria: Config Manifest

## Schema

- Config schema is backed by Zod.
- Unknown top-level keys are rejected.
- `version` and `templateVersion` are required.
- `preset` is `null` or a safe preset id.
- `memoryProfile` and `mode` support `lite`, `standard`, and `strict`.
- `memoryProfile` and `mode` must match in P2.
- `aiTools` supports `claude`, `codex`, `cursor`, and `generic`.
- `docsDir`, `featuresDir`, `modulesDir`, and `adrDir` must be safe relative paths.
- `writePolicy` supports only `skip-existing` and `overwrite` in P2.

## No Decision Index Yet

- P2 config does not include `decisions`.
- P2 config does not include `acceptedDecisions`.
- P2 config does not include `proposedDecisions`.
- P2 config does not include `organizationStandards`.

## Helpers

- `createDefaultConfig(overrides?)` returns a validated config.
- `parseConfig(value)` validates unknown config input.
- `loadConfig(rootDir)` loads `.specforge/config.json`.
- `writeConfig(rootDir, config, options?)` writes `.specforge/config.json` through safe write planning and execution.

## Dogfooding

- Root `.specforge/config.json` exists.
- Root config validates.
- Root config has no secrets and no secret-like custom fields.

## Runtime Boundary

- No CLI commands are implemented.
- No template renderer is implemented.
- No preset runtime is implemented.
- No doctor checks are implemented.
- No MCP runtime, network, telemetry, or AI API behavior is added.
