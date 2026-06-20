# Tasks: Empty-Folder Init And Repository Memory First

## T0: Add Feature Docs

Status: Done

Scope:

- `docs/40-features/F-004-empty-folder-init-repository-memory-first/`

Acceptance:

- PRD, acceptance, architecture impact, plan, tasks, test plan, review, and completion report exist.

## T1: Add Module Memory

Status: Done

Scope:

- `docs/30-modules/repository-init/`
- `docs/30-modules/repository-memory/`

Acceptance:

- Module ownership, boundaries, test expectations, and decisions are documented.

## T2: Update Product And Architecture Docs

Status: Done

Scope:

- Canonical product docs.
- Memory engine docs.
- Opinion pack docs.
- Architecture docs.
- Build priority docs.

Acceptance:

- Empty-folder init is first-class.
- SpecForge is a repository memory layer, not an app generator.
- Presets and detection remain guidance/proposed decisions only.

## T3: Sync Root Product Docs

Status: Done

Scope:

- `PRD.md`
- `BRD.md`
- `priority.md`

Acceptance:

- Root product docs match canonical product docs.

## T4: Verify And Complete

Status: Done

Scope:

- Automated checks.
- Manual docs review.
- Drift review.
- Completion report.

Acceptance:

- `pnpm test:run` passes.
- `pnpm typecheck` passes.
- Manual docs review passes.
- No runtime scope changed.
