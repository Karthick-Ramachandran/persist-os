# File Write Policy

## Default Policy

SpecForge must skip existing files by default.

The default write policy is:

```txt
skip-existing
```

## MVP Supported Behavior

MVP must support:

- Skip existing files.
- Dry run with no writes.
- Force overwrite only when explicit.
- Clear write summary.
- Clear conflict reporting.

## Safety Rules

SpecForge must:

- Never delete user files during init.
- Never overwrite without `--force`.
- Never write outside the project root.
- Reject path traversal.
- Reject absolute output paths.
- Reject null-byte input.
- Reject unsafe empty names.
- Refuse unsafe symlink writes by default.
- Never execute generated files.
- Never fetch remote templates in MVP.

## Future Policies

The config may eventually support:

- `skip-existing`
- `overwrite`
- `backup-and-write`
- `fail-on-conflict`

Only `skip-existing`, `--dry-run`, and explicit `--force` are required for MVP.

## Required Tests

P1 must include tests for:

- `../../evil`
- Absolute paths
- Null bytes
- Empty names
- Existing files skipped by default
- `--dry-run` writes nothing
- `--force` overwrites only requested paths
- Symlink writes refused by default
