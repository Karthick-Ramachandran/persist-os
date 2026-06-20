# Acceptance Criteria: Core Filesystem Safety

## Safe Names

- `slugify("Auth Provider")` returns `auth-provider`.
- Slugs contain only lowercase `a-z`, `0-9`, and single hyphens.
- Slugs have no leading or trailing hyphen.
- Slugs are at most 80 characters.
- Empty input, `.`, `..`, path separators, traversal input, null bytes, control chars, Windows reserved names, and names ending in dot or space are rejected.

## Safe Paths

- Relative forward-slash paths are accepted.
- Dot-directories like `.specforge/config.json` are accepted.
- Absolute paths are rejected.
- Backslashes are rejected.
- `..` segments are rejected.
- Empty path segments are rejected.
- Null bytes and control chars are rejected.
- Resolved paths must stay inside `rootDir`.

## Write Planning

- Write plans preserve caller input order.
- Duplicate normalized destinations are rejected.
- Existing files are detected.
- Existing files are skipped by default.
- Existing files are marked overwrite only with explicit overwrite policy.
- Write planning never mutates the filesystem.

## Write Execution

- Plans with any error entry are refused and write nothing.
- Dry run writes nothing.
- Parent directories are created only during real writes.
- Existing files are not overwritten by default.
- Explicit overwrite policy is required for overwrites.
- Target symlinks are refused.
- Existing parent symlinks are refused.

## Out Of Scope

- Race-free TOCTOU protection.
- Atomic temp-file rename writes.
- Case-insensitive collision detection.
