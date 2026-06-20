# Acceptance Criteria: Empty-Folder Init And Repository Memory First

## Product Semantics

- SpecForge is documented as a repository memory layer, not a repo bootstrap or app generator.
- `specforge init` is documented as valid in an empty folder.
- Existing app code is not required.
- Existing framework files are not required.
- Git repository presence is optional, though recommended for normal development.

## Workflows

- Greenfield workflow is documented: empty folder -> `specforge init` -> app/framework later.
- Existing repository workflow is documented: app exists -> neutral `specforge init` -> optional detected guidance later.
- Legacy adoption workflow is documented as future `specforge adopt`.

## Presets And Detection

- `specforge init --preset <name>` means neutral memory plus optional opinion-pack guidance and proposed decisions.
- Presets must not silently accept architecture, state management, backend, folder structure, or vendor choices.
- Technology detection may suggest guidance only.
- Technology detection must not become accepted repository memory by itself.

## Runtime Boundary

- No CLI implementation changes.
- No config schema changes.
- No template changes.
- No runtime presets.
- No technology detection implementation.
- No `adopt` implementation.
- No MCP runtime, network, telemetry, dependency, or generated app behavior changes.

## Verification

- `pnpm test:run` passes.
- `pnpm typecheck` passes.
- Manual docs review passes.
- Root product docs are synchronized with canonical product docs.
