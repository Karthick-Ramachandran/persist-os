# PRD: Template Renderer

## Purpose

Add the core template renderer that future SpecForge generators will use to produce deterministic repository memory documents.

P3 deliberately implements placeholder-only rendering. It does not add Eta or any template engine that can execute logic.

## Problem

SpecForge will eventually generate PRDs, ADRs, module memory, agent instructions, and review docs. Those generated artifacts need a small rendering primitive before higher-level generators can exist.

If rendering supports code execution, template logic, includes, or remote templates too early, the MVP trust boundary expands before the product has command-level safeguards and review workflows.

## Decision

P3 introduces a deterministic placeholder renderer under `core/generator`.

Templates are plain strings with placeholders such as:

```txt
{{name}}
{{ name }}
```

Context keys and placeholder keys must be simple safe identifiers. Values are strings, numbers, or booleans and are rendered with deterministic string conversion.

## Agent Memory Insight

Root agent files such as `AGENTS.md` and `CLAUDE.md` are entry points, not guarantees.

SpecForge must assume agents may forget context, continue after compaction, or fail to re-read root instructions. Durable repository memory belongs in `docs/`, where humans, agents, review workflows, and future `doctor` checks can re-read and validate it.

Models are temporary. Repositories are permanent.

## In Scope

- `TemplateValue`, `TemplateContext`, and `TemplateRenderError`.
- `createTemplateContext(values)` with key and value validation.
- `renderTemplate(template, context)` for placeholder replacement.
- Unit tests for deterministic rendering and unsafe syntax rejection.
- ADR for choosing placeholder-only rendering.
- Generator module memory.
- Documentation updates removing Eta as the P3 template engine.

## Non-Goals

- Eta or another template engine.
- Template file loading.
- File writing.
- CLI commands.
- Preset runtime.
- Template registry.
- Markdown escaping policy.
- Conditionals, loops, helpers, partials, includes, or expressions.
- Network calls, telemetry, MCP runtime, AI API calls, or cloud behavior.

## Success Criteria

- Valid placeholders render deterministically.
- Missing values fail clearly.
- Invalid placeholder syntax fails clearly.
- Context keys are validated before rendering.
- Prototype-adjacent keys are rejected.
- User-provided strings are inserted as text and never executed.
- No dependency is added.
- No file write behavior changes.
