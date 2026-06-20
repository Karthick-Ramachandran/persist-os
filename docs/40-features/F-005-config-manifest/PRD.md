# PRD: Config Manifest

## Purpose

Add the core config manifest that future commands will read instead of guessing repository paths and defaults.

P2 keeps config boring and useful.

## Problem

Future commands need a stable local config file for repository memory settings, output directories, AI targets, and write policy.

Without a config manifest, commands will duplicate defaults and drift from each other.

## Decision

SpecForge will use:

```txt
.specforge/config.json
```

P2 implements schema validation, defaults, loading, and safe writing.

P2 also dogfoods the manifest with SpecForge's own root config.

## In Scope

- Zod-backed config validation.
- Default neutral config.
- Config load helper.
- Config write helper using the existing safe write pipeline.
- Root `.specforge/config.json`.
- Config module memory and feature docs.

## Non-Goals

- CLI commands.
- Template rendering.
- Preset runtime.
- Doctor checks.
- Technology detection.
- Decision indexing.
- Organization standards indexing.
- Network calls.
- Telemetry.
- MCP runtime.

## Config Shape

P2 config includes:

```txt
version
templateVersion
preset
memoryProfile
mode
aiTools
docsDir
featuresDir
modulesDir
adrDir
writePolicy
```

P2 config intentionally does not include:

```txt
decisions
acceptedDecisions
proposedDecisions
organizationStandards
```

Those belong to later work after the boring manifest is stable.

## Success Criteria

- Default config validates.
- Invalid config is rejected.
- Unknown keys are rejected.
- Unsafe paths are rejected.
- Root config validates.
- Config writing uses safe writes.
- Existing config is skipped by default.
- Dry run writes nothing.
- Force overwrite works explicitly.
