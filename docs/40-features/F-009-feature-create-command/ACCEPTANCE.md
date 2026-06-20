# Acceptance Criteria: Feature Create Command

## Command Behavior

- `feature create <name>` creates a feature folder under configured `featuresDir`.
- Command requires `.specforge/config.json`.
- Command fails clearly when config is missing.
- Feature names are slugified.
- Unsafe feature names are rejected.
- Existing feature docs are skipped by default.
- `--dry-run` reports planned writes and writes nothing.
- `--force` overwrites explicitly.

## Generated Docs

Created feature folders include:

- `PRD.md`
- `ACCEPTANCE.md`
- `ARCHITECTURE_IMPACT.md`
- `CHANGE_REQUESTS.md`
- `PLAN.md`
- `TASKS.md`
- `TEST_PLAN.md`
- `REVIEW.md`
- `COMPLETION_REPORT.md`

## Numbering

- First valid feature number is `F-001`.
- Next number increments from the highest valid `F-###-*` folder.
- A valid existing folder with the same slug is reused so reruns are idempotent.
- Malformed folders are ignored.

## Runtime Boundary

- No app code is generated.
- No package `bin`, build, release, ADR create, module create, doctor, technology detection, network, telemetry, MCP runtime, AI API, or cloud behavior is added.
