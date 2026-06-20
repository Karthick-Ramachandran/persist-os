# Tasks: Core Filesystem Safety

## T0: Create P1 Docs And Module Memory

Status: Done

Scope:

- `docs/40-features/F-001-core-filesystem-safety/`
- `docs/30-modules/filesystem/`
- `docs/30-modules/naming/`

Acceptance:

- Feature docs exist before implementation.
- Module memory exists before implementation.

Tests:

- Documentation structure inspection.

Do not:

- Implement runtime code in this task.

## T1: Add TypeScript/Vitest Scaffold

Status: Done

Scope:

- `package.json`
- `tsconfig.json`
- `vitest.config.ts`
- generated `pnpm-lock.yaml`

Acceptance:

- `pnpm install` generates the lockfile.
- `pnpm test:run` can run tests.
- `pnpm typecheck` can typecheck source and tests.

Tests:

- `pnpm test:run`
- `pnpm typecheck`

Do not:

- Add CLI framework or runtime dependencies.

## T2: Implement Slugify

Status: Done

Scope:

- `src/core/naming/slugify.ts`
- `tests/unit/naming/slugify.test.ts`

Acceptance:

- Valid names normalize to safe slugs.
- Unsafe names are rejected.
- Windows reserved names are rejected.

Tests:

- Unit tests for normalization and rejection cases.

Do not:

- Use slugs to sanitize traversal input into safe-looking names.

## T3: Implement Safe Path Resolution

Status: Done

Scope:

- `src/core/filesystem/safe-path.ts`
- `tests/unit/filesystem/safe-path.test.ts`
- `tests/security/path-traversal.test.ts`

Acceptance:

- Safe relative paths resolve inside root.
- Unsafe paths are rejected.

Tests:

- Unit and security path tests.

Do not:

- Allow backslashes or `..` segments.

## T4: Implement Write Planning And Conflict Policy

Status: Done

Scope:

- `src/core/filesystem/conflict-policy.ts`
- `src/core/filesystem/write-plan.ts`
- `tests/unit/filesystem/write-plan.test.ts`
- `tests/unit/filesystem/conflict-policy.test.ts`

Acceptance:

- Plan entries classify create, skip, overwrite, and error.
- Duplicate normalized destinations are rejected.
- Existing files are skipped by default.

Tests:

- Unit tests for plan classification and duplicate detection.

Do not:

- Write files during planning.

## T5: Implement Safe Writes

Status: Done

Scope:

- `src/core/filesystem/write-file-safe.ts`
- `tests/unit/filesystem/write-file-safe.test.ts`
- `tests/security/overwrite-policy.test.ts`
- `tests/security/symlink-policy.test.ts`

Acceptance:

- Plans with errors write nothing.
- Dry run writes nothing.
- Symlinks are refused.
- Overwrite requires explicit policy.

Tests:

- Unit and security write tests.

Do not:

- Claim race-free TOCTOU protection.

## T6: Review And Completion

Status: Done

Scope:

- `REVIEW.md`
- `COMPLETION_REPORT.md`
- module memory docs

Acceptance:

- Commands run are recorded.
- Remaining risks are documented.
- Drift review is complete.

Tests:

- Documentation review.
