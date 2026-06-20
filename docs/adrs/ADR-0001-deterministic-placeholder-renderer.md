# ADR-0001: Deterministic Placeholder Renderer

## Status

Accepted

## Context

SpecForge needs template rendering before it can generate feature docs, ADRs, module memory, root agent files, and init output.

Earlier planning named Eta as the template engine. That adds more capability than P3 needs and introduces a larger trust boundary around template logic and execution semantics.

P3 needs deterministic document rendering, not a general-purpose template language.

## Decision

SpecForge will implement an internal placeholder-only renderer for P3.

Supported placeholders are simple safe identifiers:

```txt
{{name}}
{{ name }}
```

Context keys must match the same safe identifier rules and must not be `constructor`, `__proto__`, or `prototype`.

Supported context values are strings, numbers, and booleans.

The renderer must reject execution markers, template logic, expressions, conditionals, loops, helpers, partials, includes, dot paths, and bracket paths.

## Alternatives Considered

Eta:

- More capable than P3 requires.
- Adds dependency and template execution semantics.
- Deferred until a future ADR shows advanced templating is necessary.

Mustache-style templates:

- Familiar and logic-light.
- Still brings partial and section semantics that P3 does not need.
- Deferred until generated output needs justify the extra semantics.

String replacement without validation:

- Simple to implement.
- Rejected because unsafe placeholder keys, missing values, and prototype-adjacent names should fail clearly.

## Consequences

Positive:

- No new dependency is added.
- Rendering stays deterministic and easy to test.
- Template injection surface is small.
- Future generator code can build on a stable primitive.

Tradeoffs:

- No conditionals or loops in P3.
- More complex document variants must be assembled by generator code or deferred.
- If future templates need richer behavior, a new ADR is required.

## Related Documents

- PRD: `docs/40-features/F-006-template-renderer/PRD.md`
- Architecture: `docs/10-architecture/ARCHITECTURE.md`
- Architecture: `docs/10-architecture/MODULE_BOUNDARIES.md`
- Architecture: `docs/10-architecture/TECH_STACK.md`
- Security: `docs/20-security/THREAT_MODEL.md`
- Feature: `docs/40-features/F-006-template-renderer/ARCHITECTURE_IMPACT.md`
