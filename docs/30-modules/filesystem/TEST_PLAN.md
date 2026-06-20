# Filesystem Module Test Plan

## Unit Tests

- Safe path resolution.
- Conflict policy.
- Write plan classification.
- Safe write execution.

## Security Tests

- Path traversal rejection.
- Absolute path rejection.
- Duplicate normalized destination rejection.
- Dry-run writes nothing.
- Existing files skipped by default.
- Explicit overwrite required.
- Target symlink refused.
- Parent symlink refused.
- Plan with errors writes nothing.
