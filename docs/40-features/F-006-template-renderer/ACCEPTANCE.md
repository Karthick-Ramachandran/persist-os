# Acceptance Criteria: Template Renderer

## Rendering

- `renderTemplate` replaces `{{name}}` placeholders.
- `renderTemplate` accepts whitespace around placeholder names.
- Repeated placeholders render consistently.
- String, number, and boolean values render deterministically.
- Multiline string values render as text.
- Extra unused context keys are allowed.

## Validation

- `createTemplateContext` rejects invalid keys.
- `createTemplateContext` rejects `constructor`, `__proto__`, and `prototype`.
- `createTemplateContext` rejects non-string, non-number, and non-boolean values.
- Missing placeholder values fail with `TemplateRenderError`.
- Invalid placeholder names fail with `TemplateRenderError`.
- Dot paths, bracket paths, expressions, conditionals, loops, partials, includes, and helpers are rejected.

## Security Boundary

- Eta/EJS-style markers such as `<%` and `%>` are rejected.
- Mustache-style logic markers such as `{{#`, `{{/`, `{{^`, and `{{>` are rejected.
- Code-like strings are rendered as plain text.
- P3 does not load template files.
- P3 does not write files.
- P3 does not add dependencies.
- P3 does not add network, telemetry, MCP runtime, AI API, or cloud behavior.

## Documentation

- An accepted ADR records the placeholder-only renderer decision.
- Generator module memory exists.
- Product and architecture docs no longer describe Eta as the P3 template engine.
- The agent-memory insight is documented.
