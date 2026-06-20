# Architecture Impact: Empty-Folder Init And Repository Memory First

## Summary

P1.7 is docs-only.

It clarifies future init semantics without changing runtime architecture.

## Impacted Areas

- Product positioning.
- Memory engine architecture.
- Opinion pack semantics.
- Future init command requirements.
- Future adoption command direction.

## Architecture Decisions

No ADR is required for P1.7 because no runtime architecture, dependency policy, file write policy, security posture, network behavior, telemetry behavior, MCP behavior, or preset execution model changes.

The documented decision is:

```txt
SpecForge initializes repository memory.
Application code may come before or after.
```

## Future Runtime Direction

Future `specforge init` should:

- Work in empty directories.
- Not require a Git repository.
- Not require existing app code.
- Generate neutral memory by default.
- Skip existing files by default.
- Treat presets as optional opinion packs.

Future technology detection may:

- Identify likely frameworks.
- Suggest relevant opinion packs.
- Suggest proposed ADRs.

Future technology detection must not:

- Accept decisions automatically.
- Choose architecture automatically.
- Generate production app code.
- Override accepted repository memory.

## Runtime Scope

P1.7 does not implement runtime behavior.

No TypeScript interfaces, commands, config schemas, templates, presets, MCP behavior, network calls, telemetry, dependencies, or generated app code change.
