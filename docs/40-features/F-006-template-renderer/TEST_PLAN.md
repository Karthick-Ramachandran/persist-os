# Test Plan: Template Renderer

## Unit Tests

- Renders basic placeholders.
- Renders placeholders with surrounding whitespace.
- Renders repeated placeholders consistently.
- Renders string, number, and boolean values.
- Renders multiline string values.
- Allows unused context keys.
- Fails clearly on missing values.
- Fails clearly on invalid placeholder names.
- Fails clearly on invalid context keys.
- Rejects `constructor`, `__proto__`, and `prototype`.
- Rejects non-string, non-number, and non-boolean context values.

## Security Tests

- Rejects Eta/EJS-style execution markers.
- Rejects Mustache-style logic markers.
- Rejects dot paths, bracket paths, expressions, helpers, partials, conditionals, and loops.
- Renders code-like values as plain text.

## Verification

Run:

```txt
pnpm test:run
pnpm typecheck
```

## Out Of Scope

- Golden tests for generated documents.
- CLI integration tests.
- File loading tests.
- File writing tests.

Those belong to later generator and command milestones.
