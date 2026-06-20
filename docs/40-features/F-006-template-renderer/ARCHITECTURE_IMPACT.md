# Architecture Impact: Template Renderer

## Affected Modules

- `core/generator`

## New Module Behavior

`core/generator` owns deterministic template rendering.

It must not write files directly. Future generators will combine rendered content with the filesystem write-plan and safe-write modules.

## ADR Impact

P3 creates:

```txt
docs/adrs/ADR-0001-deterministic-placeholder-renderer.md
```

This ADR replaces the earlier planned Eta direction with a smaller internal placeholder renderer.

## Dependency Impact

No dependency is added.

Advanced templating engines are deferred until a future ADR shows they are necessary.

## Security Impact

Template rendering remains local and deterministic.

P3 reduces template-injection risk by rejecting execution markers, logic syntax, nested paths, expressions, and prototype-adjacent keys.

## File Write Impact

No file write behavior changes.

The renderer accepts strings and returns strings. It does not load files, write files, or bypass `core/filesystem`.

## Agent Memory Impact

P3 documents that agent instructions are routing files, not reliable memory guarantees. Durable memory remains in `docs/`, and future doctor and drift review workflows should validate repository memory after agent work.
