# Test Plan: Empty-Folder Init And Repository Memory First

## Automated Verification

Run:

```bash
pnpm test:run
pnpm typecheck
```

Expected:

- Existing tests pass.
- Typecheck passes.

## Manual Docs Review

Confirm:

- Empty-folder init is explicitly first-class.
- `specforge init` remains architecture-neutral.
- Existing app code and framework files are not required.
- Git repository presence is optional for init.
- Presets are optional opinion packs and produce guidance or proposed ADRs only.
- Technology detection is documented as guidance only, not accepted memory.
- Future `adopt` remains out of runtime scope.
- No runtime code, config, dependency, template, network, telemetry, MCP, or generated app behavior changed.
- Root product docs are synchronized with canonical docs.
