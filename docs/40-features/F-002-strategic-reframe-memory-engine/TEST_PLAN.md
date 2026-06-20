# Test Plan: Strategic Reframe

## Automated Verification

Run:

```bash
pnpm test:run
pnpm typecheck
```

Expected:

- Existing runtime tests pass.
- Typecheck passes.

## Manual Docs Review

Review for:

- Core docs do not imply SpecForge chooses architecture.
- `specforge init` is neutral by default.
- Presets are optional opinion packs.
- Preset suggestions are proposed, not accepted.
- Drift is mismatch with accepted repository memory.
- Repository decisions and organization memory are distinct layers.

## Out Of Scope

- New runtime tests.
- CLI behavior tests.
- Config schema tests.
