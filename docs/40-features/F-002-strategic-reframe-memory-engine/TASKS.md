# Tasks: Strategic Reframe

## T0: Add Strategic Architecture Docs

Status: Done

Scope:

- `docs/10-architecture/MEMORY_ENGINE.md`
- `docs/10-architecture/REPOSITORY_DECISIONS.md`
- `docs/10-architecture/OPINION_PACKS.md`
- `docs/10-architecture/ORGANIZATION_MEMORY.md`

Acceptance:

- Four-layer model is documented.
- Core architecture-neutral principle is explicit.

## T1: Add Feature Docs And Module Memory

Status: Done

Scope:

- `docs/40-features/F-002-strategic-reframe-memory-engine/`
- `docs/30-modules/product-memory/`
- `docs/30-modules/repository-decisions/`
- `docs/30-modules/opinion-packs/`
- `docs/30-modules/organization-memory/`

Acceptance:

- Strategic reframe is dogfooded.

## T2: Update Product Positioning

Status: Done

Scope:

- `docs/00-product/PRD.md`
- `docs/00-product/BRD.md`
- root `PRD.md`
- root `BRD.md`

Acceptance:

- SpecForge is described as architecture-neutral.
- Drift is described as mismatch with accepted repository memory.
- Neutral init is the primary path.

## T3: Update Build Priority Language

Status: Done

Scope:

- `docs/00-product/BUILD_PRIORITY.md`
- root `priority.md`

Acceptance:

- Presets are described as opinion packs.
- Preset-generated decisions are proposed, not accepted.
- Future config language avoids mandatory architecture ownership by SpecForge.

## T4: Verify And Review

Status: Done

Scope:

- Existing tests.
- Typecheck.
- Docs review.

Acceptance:

- `pnpm test:run` passes.
- `pnpm typecheck` passes.
- Review confirms no runtime scope change.
