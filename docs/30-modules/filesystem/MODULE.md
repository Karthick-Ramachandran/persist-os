# Module: Filesystem

## Purpose

The filesystem module owns safe path resolution, write planning, conflict handling, and safe file writes.

## Owns

- Validating generated output paths.
- Rejecting unsafe paths.
- Detecting duplicate normalized destinations.
- Detecting existing files.
- Classifying write actions.
- Executing safe writes.
- Dry-run behavior.
- Best-effort symlink refusal.

## Does Not Own

- CLI command parsing.
- Config schema.
- Template rendering.
- Preset schemas.
- Generated document content.
- Network behavior.

## Public Interfaces

- `resolveSafePath`
- `createWritePlan`
- `executeWritePlan`
- `writeFileSafe`
- `ConflictPolicy`
- `WritePlanEntry`
- `WritePlan`
- `WriteResult`

## Security Boundaries

- Must never allow writes outside the project root.
- Must reject traversal and absolute destinations.
- Must skip existing files by default.
- Must refuse plans with errors.
- Must refuse target and existing parent symlinks by default.

## Related Docs

- `docs/40-features/F-001-core-filesystem-safety/`
- `docs/10-architecture/FILE_WRITE_POLICY.md`
- `docs/20-security/SECURE_FILE_WRITES.md`
