# Completion Report: Opinionated Presets

## Status

Complete.

## Tasks Completed

- T1: Documented the opinionated-preset content standard in OPINION_PACKS.md and planned the feature.
- T2: Added the `kotlin-android` preset with rich guidance and six proposed ADRs.
- T3: Added the `python-fastapi` preset with rich guidance and five proposed ADRs.
- T4: Enriched `ios-swift` and `nextjs` with five proposed ADRs each, preserving golden anchors.
- T5: Added tests, regenerated examples, updated docs, and recorded completion evidence.

## Files Changed

- `src/presets/kotlin-android/preset.ts` (new), `src/presets/python-fastapi/preset.ts` (new)
- `src/presets/ios-swift/preset.ts`, `src/presets/nextjs/preset.ts` (enriched)
- `src/core/presets/preset-registry.ts`
- `tests/unit/presets/opinionated-presets.test.ts` (new)
- `tests/unit/presets/validate-preset.test.ts`
- `tests/golden/generated-kotlin-android.test.ts` (new),
  `tests/golden/generated-python-fastapi.test.ts` (new)
- `tests/integration/init-command.test.ts`
- `docs/10-architecture/OPINION_PACKS.md`
- `docs/40-features/F-018-opinionated-presets/` (new feature memory)
- `README.md`
- `examples/generated-kotlin-android/`, `examples/generated-python-fastapi/` (new),
  `examples/generated-ios-swift/`, `examples/generated-nextjs/` (regenerated)

## Tests Run

- `pnpm test:run`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check`
- `pnpm build`
- `pnpm pack:check`
- `node dist/cli.js doctor`

## Results

- Full test suite passed: 39 files, 195 tests (added preset tests and two golden suites).
- `pnpm typecheck`, `pnpm lint`, and `pnpm format:check` passed.
- `pnpm build` passed; `pnpm pack:check` validated 169 package files (up from 104 for the new
  presets, ADRs, and example trees).
- `node dist/cli.js doctor` passed after this report was written.
- `recall preset list` shows all six presets, with the four opinionated packs marked accordingly.

## Remaining Risks

- The `generic` and `flutter` presets are not enriched in this batch; `flutter` remains a stub.
- Deferred stacks (Java/Spring Boot, React Native, Node/NestJS) are not yet implemented.
- Proposed ADR content is intentionally concise; teams must expand context before accepting.

## Docs Updated

- OPINION_PACKS.md content standard, F-018 feature memory, README preset and example lists.

## Engineering Standards

Engineering standards were followed. The change is scoped, tested, and documented. Neutrality is
preserved structurally: every preset decision is `Proposed`. No schema change, dependency,
network, telemetry, or generated production app code was introduced.
