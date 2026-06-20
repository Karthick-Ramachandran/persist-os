# Test Plan: Module Create Command

## Unit Tests

- Module generator emits `MODULE.md`, `TASKS.md`, `TEST_PLAN.md`, and `DECISIONS.md`.
- Module generator paths are deterministic.
- Module generator returns write inputs only.
- Unsafe module names are rejected.

## Integration Tests

- Command requires initialized config.
- Command creates module folder and docs.
- Command skips existing files by default.
- Command supports `--dry-run`.
- Command supports `--force`.
- Command rejects unsafe names.
- Command respects configured `modulesDir`.
- Command output is actionable.

## Regression Tests

Existing init, feature create, and ADR create tests must continue to pass after shared write-summary helper extraction.

## Verification

Run:

```txt
pnpm test:run
pnpm typecheck
git diff --check
```
