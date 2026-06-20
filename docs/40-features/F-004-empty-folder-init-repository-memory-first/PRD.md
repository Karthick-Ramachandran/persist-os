# PRD: Empty-Folder Init And Repository Memory First

## Purpose

Lock the product decision that SpecForge initializes repository memory, not application code.

SpecForge must work before the first line of app code exists.

## Problem

If `specforge init` requires an existing Flutter, Next.js, Swift, Android, or other app, SpecForge becomes tied to implementation frameworks.

That weakens the architecture-neutral memory engine position.

## Decision

`specforge init` must work in an empty folder as a first-class workflow.

Git initializes source control.

SpecForge initializes repository memory.

Code may come before or after SpecForge.

## Users

- Solo founders starting a new AI-built product.
- Developers adding memory to an existing repository.
- Teams that want to adopt repository memory later.

## Workflows

### Greenfield

```bash
mkdir expense-tracker
cd expense-tracker
specforge init
```

SpecForge creates neutral repository memory. The app framework may be created later.

### Existing Repository

```bash
cd existing-app
specforge init
```

SpecForge initializes neutral memory and may later offer detected guidance.

Technology detection may suggest guidance, but detection must not become accepted repository memory by itself.

### Legacy Adoption

```bash
cd mature-repo
specforge adopt
```

`adopt` is future scope. It may create repository memory from existing systems after review.

## In Scope

- Document empty-folder init as first-class.
- Document `specforge init` as neutral repository memory.
- Document preset behavior as guidance and proposed decisions.
- Document technology detection as guidance only.
- Add module memory for repository init and repository memory semantics.

## Non-Goals

- Implement CLI runtime.
- Implement config changes.
- Implement templates.
- Implement presets.
- Implement technology detection.
- Implement `adopt`.
- Add network, telemetry, MCP runtime, or dependency changes.

## Success Criteria

- Product docs say empty-folder init is supported.
- Architecture docs say SpecForge initializes memory independent of app code.
- Preset docs say `--preset` produces guidance or proposed ADRs, not accepted decisions.
- Existing-repo detection is guidance only.
- P1.7 changes no runtime behavior.
