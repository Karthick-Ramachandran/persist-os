# Test Plan: Core Filesystem Safety

## Unit Tests

- `slugify` normalizes valid names.
- `slugify` rejects empty input, path separators, traversal, null bytes, control chars, Windows reserved names, trailing dot/space, and empty normalized output.
- `resolveSafePath` accepts safe relative paths and `.specforge/config.json`.
- `resolveSafePath` rejects absolute paths, backslashes, `..`, empty segments, null bytes, control chars, and root escapes.
- `createWritePlan` preserves caller input order.
- `createWritePlan` detects duplicate normalized destinations.
- `createWritePlan` classifies create, skip, overwrite, and error entries.
- `executeWritePlan` refuses plans with errors.

## Security Tests

- `../../evil` is rejected.
- Absolute POSIX and Windows-like paths are rejected.
- `docs/A.md` and `docs//A.md` are treated as duplicate normalized destinations.
- Dry run writes nothing.
- Existing files are skipped by default.
- Explicit overwrite does not bypass path safety.
- Target symlink is refused.
- Existing parent symlink is refused.
- A plan with any error entry writes nothing.

## Verification Commands

```bash
pnpm install
pnpm test:run
pnpm typecheck
```
