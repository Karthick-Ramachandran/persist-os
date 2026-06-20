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

- Golden tests for generated documents.
- Integration tests for command-driven generation.
- Security tests for unsafe output destinations after generator plans are connected to filesystem writes.

## Security Expectations

- The renderer must not execute template content.
- The renderer must not load template files.
- The renderer must not write files.
- Future file generation must use `core/filesystem`.
