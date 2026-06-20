# Secure File Writes

## Goal

SpecForge must make file writes predictable, reviewable, and non-destructive.

## Rules

- Build a write plan before writing.
- Validate every destination path against the project root.
- Reject absolute paths.
- Reject path traversal.
- Reject null bytes.
- Reject unsafe empty names.
- Detect existing files before writing.
- Skip existing files by default.
- Write only when the final write plan is safe.
- Report created, skipped, and conflicted files.

## Symlink Policy

MVP must refuse unsafe symlink writes by default.

Do not follow symlinks when the target might escape the project root.

If future behavior allows symlink writes, that requires an ADR and security tests.

## Dry Run

Dry run must perform validation and report intended writes without mutating the filesystem.

## Force

Force must be explicit and visible in output.

Force should not bypass safe path validation.

Force should not allow writes outside the project root.
