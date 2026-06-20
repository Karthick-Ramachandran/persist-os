# Tasks: Opinionated Presets

Build one task at a time with evidence.

## T1: Plan and content standard

- Status: Complete.
- Scope: Feature docs and the opinionated-preset content standard in OPINION_PACKS.md.
- Acceptance: Standard defines guidance plus at least four proposed ADRs per preset.
- Do not: Change the preset schema or neutrality contract.

## T2: Kotlin Android preset

- Status: Complete.
- Scope: New `kotlin-android` preset with guidance and proposed ADRs.
- Acceptance: Validates, decisions are proposed, appears in preset list.
- Tests: Preset registry and unit tests.

## T3: Python FastAPI preset

- Status: Complete.
- Scope: New `python-fastapi` preset with guidance and proposed ADRs.
- Acceptance: Validates, decisions are proposed, appears in preset list.
- Tests: Preset registry and unit tests.

## T4: Enrich ios-swift and nextjs

- Status: Complete.
- Scope: Richer guidance and additional proposed ADRs, preserving golden anchors.
- Acceptance: Golden tests still pass; new decisions are proposed.
- Tests: Golden and unit tests.

## T5: Tests, examples, docs, completion

- Status: Complete.
- Scope: Tests, regenerated examples, README, review, and completion report.
- Acceptance: All quality gates recorded with results.
- Tests: Full suite, typecheck, lint, format, build, pack, and `recall doctor`.
