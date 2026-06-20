# Module: Repository Init

## Purpose

Repository init defines what `specforge init` means.

It initializes repository memory, not application code.

## Owns

- Empty-folder init semantics.
- Neutral init expectations.
- Init command product behavior.
- Relationship between init, presets, and detected guidance.

## Does Not Own

- Template rendering implementation.
- Config schema implementation.
- Technology detection implementation.
- Legacy adoption implementation.
- Production app generation.

## Public Interface Direction

CLI behavior:

```bash
specforge init
specforge init --preset <name>
```

`specforge init` should be valid in an empty folder and should not require existing app code or a framework.

## Current Decision

P5 implements repository memory init.

Git initializes source control.

SpecForge initializes repository memory.
