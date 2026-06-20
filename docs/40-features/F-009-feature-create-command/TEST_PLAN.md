# Test Plan: Feature Create Command

## Unit Tests

- Feature numbering starts at `F-001`.
- Feature numbering increments from existing valid folders.
- Feature numbering reuses an existing folder for the same slug.
- Malformed feature folders are ignored.
- Feature generator emits all required docs.
- Feature generator paths are deterministic.
- Unsafe feature names are rejected.

## Integration Tests

- Command requires initialized config.
- Command creates feature folder and docs.
- Command skips existing files by default.
- Command supports `--dry-run`.
- Command supports `--force`.
- Command rejects unsafe names.
- Command increments feature number.
- Command output is actionable.

## Verification

Run:

```txt
pnpm test:run
pnpm typecheck
```
