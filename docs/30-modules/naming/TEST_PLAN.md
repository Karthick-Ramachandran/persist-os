# Naming Module Test Plan

## Unit Tests

- Normalizes words and spacing.
- Collapses repeated separators into one hyphen.
- Enforces max length.
- Rejects empty input.
- Rejects `.`, `..`, traversal, separators, null bytes, control chars, Windows reserved names, trailing dot, and trailing space.

## Feature Number Tests

- Starts at `F-001` when the features directory is missing.
- Increments from the highest valid existing feature folder.
- Ignores malformed feature folders.
- Reuses a valid existing folder for the same slug.
- Allocates the next feature folder for a new slug.
- Parses and formats valid feature numbers.

## P6 Results

- Covered by `tests/unit/naming/feature-number.test.ts`.
- Full verification passed with `pnpm test:run` and `pnpm typecheck`.

## ADR Number Tests

- Starts at `ADR-0001` when the ADR directory is missing.
- Increments from the highest valid existing ADR file.
- Ignores malformed ADR files.
- Reuses a valid existing file for the same slug.
- Allocates the next ADR file for a new slug.
- Parses and formats valid ADR numbers.

## P7 Results

- Covered by `tests/unit/naming/adr-number.test.ts`.
- Full verification passed with `pnpm test:run` and `pnpm typecheck`.

## P8 Tests

- Unsafe module names are rejected through `slugify`.
- Module output paths use normalized slugs.

## P8 Results

- Covered by `tests/unit/generator/generate-module.test.ts`.
- Covered by `tests/integration/module-create-command.test.ts`.
- Full verification passed with `pnpm test:run` and `pnpm typecheck`.
