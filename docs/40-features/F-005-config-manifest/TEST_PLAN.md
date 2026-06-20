# Test Plan: Config Manifest

## Unit Tests

- Default config validates.
- Invalid JSON fails loading.
- Missing config fails with a clear error.
- Invalid memory profile, mode, AI tool, write policy, and preset type are rejected.
- `memoryProfile` and `mode` mismatch is rejected.
- Unsafe directory paths are rejected.
- Unknown top-level keys are rejected.
- Decision index keys are rejected.
- Organization standards key is rejected.
- `writeConfig` creates `.specforge/config.json`.
- Existing config is skipped by default.
- Dry run writes nothing.
- Force overwrite works through the safe write policy.

## Manual Review

- Root `.specforge/config.json` validates.
- Root config contains no secrets and no decision indexes.
- No CLI command is added.
- No template renderer is added.
- No network, telemetry, MCP runtime, or AI API behavior is added.

## Verification Commands

```bash
pnpm test:run
pnpm typecheck
```
