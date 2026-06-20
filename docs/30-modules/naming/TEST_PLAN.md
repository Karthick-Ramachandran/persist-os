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
