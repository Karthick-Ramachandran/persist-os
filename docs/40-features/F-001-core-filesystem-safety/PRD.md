# PRD: Core Filesystem Safety

## Summary

SpecForge needs safe filesystem primitives before any CLI command can generate files.

P1 builds the foundation for non-destructive, local-first writes:

- safe output path resolution
- deterministic write planning
- conflict handling
- safe file writes
- safe slug naming

No CLI commands are implemented in P1.

## Users

- Developers running future SpecForge commands.
- AI agents implementing future generation workflows.
- Reviewers validating that generated output cannot damage user repositories.

## Goals

- Prevent writes outside the project root.
- Skip existing files by default.
- Overwrite only when explicitly requested.
- Support dry-run planning with zero writes.
- Reject unsafe names and paths.
- Refuse symlink writes by default using best-effort checks.
- Provide explicit TypeScript types for write plans and results.

## Non-Goals

- CLI command implementation.
- Config manifest.
- Template rendering.
- Preset system.
- Runtime MCP.
- Network calls.
- Telemetry.
- Atomic write guarantees.
- Race-free TOCTOU protection.
- Case-insensitive filesystem collision detection.

## Source Documents

- `docs/00-product/BUILD_PRIORITY.md`
- `docs/10-architecture/FILE_WRITE_POLICY.md`
- `docs/20-security/SECURE_FILE_WRITES.md`
- `docs/50-quality/TESTING_STRATEGY.md`
