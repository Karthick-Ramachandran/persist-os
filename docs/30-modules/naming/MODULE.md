# Module: Naming

## Purpose

The naming module owns safe user-facing name normalization.

## Owns

- Slug generation.
- Unsafe name rejection.
- Windows reserved name rejection.
- Length limits.
- Feature number scanning.
- Existing feature folder resolution by slug.

## Does Not Own

- Filesystem path resolution.
- Write planning.
- CLI parsing.
- ADR numbering.

## Public Interfaces

- `slugify`
- `getNextFeatureNumber`
- `getFeatureFolderForSlug`
- `formatFeatureNumber`
- `parseFeatureNumber`

## Security Boundaries

- Must reject traversal input instead of sanitizing it into a safe-looking name.
- Must reject path separators, null bytes, control chars, reserved names, and trailing dot or space.

## Related Docs

- `docs/40-features/F-001-core-filesystem-safety/`
- `docs/40-features/F-009-feature-create-command/`
