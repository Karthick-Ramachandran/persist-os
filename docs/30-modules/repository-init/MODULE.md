# Module: Repository Init

## Purpose

Repository init defines what `persist init` means.

It initializes repository memory, not application code.

## Owns

- Empty-folder init semantics.
- Neutral init expectations.
- Init command product behavior.
- Opt-in scaffolding flags (`--features`, `--modules`).
- Relationship between init and detected guidance.

## Does Not Own

- Template rendering implementation.
- Config schema implementation.
- Technology detection implementation.
- Legacy adoption implementation.
- Production app generation.

## Public Interface Direction

CLI behavior:

```bash
persist init
persist init --features --modules
```

`persist init` should be valid in an empty folder and should not require existing app code or a
framework.

## Current Decision

P5 implements repository memory init.

Git initializes source control.

Persist OS initializes repository memory.

P9 adds local command-reference memory so humans and AI agents can discover available Persist OS
workflows after init.
