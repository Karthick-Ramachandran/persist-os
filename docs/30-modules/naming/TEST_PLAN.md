# Naming Module Test Plan

## Unit Tests

- Normalizes words and spacing.
- Collapses repeated separators into one hyphen.
- Enforces max length.
- Rejects empty input.
- Rejects `.`, `..`, traversal, separators, null bytes, control chars, Windows reserved names, trailing dot, and trailing space.
