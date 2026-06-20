# Architecture Impact: Core Filesystem Safety

## Affected Modules

- `core/filesystem`
- `core/naming`

## New Public Interfaces

- `slugify`
- `resolveSafePath`
- `createWritePlan`
- `executeWritePlan`
- `writeFileSafe`
- `ConflictPolicy`
- `WritePlanEntry`
- `WritePlan`
- `WriteResult`

## Dependency Impact

P1 filesystem logic uses only Node built-ins.

Test and TypeScript scaffold adds dev dependencies only:

- TypeScript
- Vitest
- `@types/node`

## Security Impact

This feature reduces risk by centralizing:

- path traversal rejection
- unsafe name rejection
- overwrite policy
- dry-run safety
- symlink refusal
- no-write-on-plan-error behavior

## ADR Impact

No ADR is required for P1 because current docs already establish:

- local-first behavior
- non-destructive writes
- no network calls
- no telemetry

Future changes require ADR consideration if they add:

- atomic write strategy
- race-free symlink/write protection
- remote templates
- runtime MCP
- overwrite-by-default behavior
