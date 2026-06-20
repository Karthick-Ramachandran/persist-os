# Test Plan: Init Command

## Integration Tests

- Empty folder init creates config and docs.
- Non-Git directory init works.
- Existing files are skipped by default.
- `--dry-run` writes nothing and reports planned files.
- `--force` overwrites explicitly.
- Unknown preset fails clearly and writes nothing.

## Golden Tests

- Generated generic output has deterministic file list and representative content.
- Generated Next.js output includes proposed decisions only.
- Generated iOS Swift output includes proposed decisions only.
- Generated Flutter output includes proposed decisions only.

## Security Tests

- Unknown preset does not create partial output.
- Dry run performs zero writes.
- Force does not bypass safe write planning.
- Preset output remains proposed or optional guidance.

## Verification

Run:

```txt
pnpm test:run
pnpm typecheck
```
