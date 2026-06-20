# Acceptance Criteria: Module Create Command

## Command Behavior

- `module create <name>` creates module memory under configured `modulesDir`.
- Command requires `.specforge/config.json`.
- Command fails clearly when config is missing.
- Module names are slugified.
- Unsafe module names are rejected.
- Existing module docs are skipped by default.
- `--dry-run` reports planned writes and writes nothing.
- `--force` overwrites explicitly.

## Generated Module Memory

Created module folders include:

- `MODULE.md`
- `TASKS.md`
- `TEST_PLAN.md`
- `DECISIONS.md`

## Scope

- P8 creates module memory only.
- P8 does not create feature delivery docs automatically.
- `feature create` remains the workflow for feature delivery folders.

## Output

- CLI output lists created, skipped, overwritten, or planned files.
- Shared write-summary formatting preserves existing init, feature, and ADR output behavior.

## Runtime Boundary

- No app code is generated.
- No package `bin`, build, release, doctor, technology detection, network, telemetry, MCP runtime, AI API, or cloud behavior is added.
