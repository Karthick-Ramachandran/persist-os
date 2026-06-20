# Module: Generator

## Purpose

The generator module owns deterministic rendering and future document generation plans for SpecForge repository memory.

## Owns

- Template context validation.
- Placeholder rendering.
- Future generation plans for feature, ADR, module, and init documents.
- Init memory file planning.

## Does Not Own

- CLI command parsing.
- Preset registry validation.
- Config schema or loading.
- Filesystem path safety.
- File write execution.
- Runtime MCP.
- Network behavior.
- Template code execution.

## Public Interfaces

- `TemplateValue`
- `TemplateContext`
- `TemplateRenderError`
- `createTemplateContext`
- `renderTemplate`
- `generateInitFiles`

## Boundaries

`core/generator` returns strings or generation plans.

It must not write files directly. File writes must go through `core/filesystem`.
