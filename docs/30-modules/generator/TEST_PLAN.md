# Generator Test Plan

## P3 Tests

- Placeholder rendering is deterministic.
- Missing values fail clearly.
- Invalid placeholder names fail clearly.
- Invalid context keys fail before rendering.
- Prototype-adjacent keys are rejected.
- Logic and execution syntax are rejected.
- Code-like strings render as text.

## Future Tests

- Done: Golden tests for init-generated documents.
- Done: Integration tests for init command generation.
- Done: Unit tests for generated feature document paths and starter content.
- Security tests for unsafe output destinations after generator plans are connected to filesystem writes.

## Security Expectations

- The renderer must not execute template content.
- The renderer must not load template files.
- The renderer must not write files.
- Future file generation must use `core/filesystem`.

## P6 Tests

- `generateFeatureFiles` emits all required feature docs.
- `generateFeatureFiles` returns write inputs only.
- Unsafe feature names are rejected before write planning.

## P6 Results

- Covered by `tests/unit/generator/generate-feature.test.ts`.
- Full verification passed with `pnpm test:run` and `pnpm typecheck`.

## P7 Tests

- `generateAdrFile` emits required ADR sections.
- `generateAdrFile` returns write inputs only.
- `generateAdrFile` sets status to `Proposed`.
- Unsafe ADR titles are rejected before write planning.

## P7 Results

- Covered by `tests/unit/generator/generate-adr.test.ts`.
- Full verification passed with `pnpm test:run` and `pnpm typecheck`.

## P8 Tests

- `generateModuleFiles` emits required module docs.
- `generateModuleFiles` returns write inputs only.
- Unsafe module names are rejected before write planning.

## P8 Results

- Covered by `tests/unit/generator/generate-module.test.ts`.
- Full verification passed with `pnpm test:run` and `pnpm typecheck`.

## P9 Tests

- Init generation includes `docs/ai/SPECFORGE_COMMANDS.md`.
- Init generation includes `docs/30-modules/README.md`.
- Init generation includes `docs/40-features/README.md`.
- Command reference lists current commands and the Doctor completion gate.

## P9 Results

- Covered by `tests/integration/doctor-command.test.ts`.
- Covered by `tests/golden/generated-generic.test.ts`.
- Focused P9 verification passed.
- Full verification passed with `pnpm test:run`, `pnpm typecheck`, and `git diff --check`.
