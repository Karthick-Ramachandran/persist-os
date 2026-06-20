# Architecture Impact: Init Command

## Affected Modules

- `cli`
- `commands`
- `core/generator`
- `core/filesystem`
- `core/config`
- `core/presets`

## New Behavior

P5 introduces the first command workflow.

The command layer parses options and reports results. Core modules still own config creation, generation plans, preset validation, and safe write execution.

## Dependency Impact

P5 adds Commander for CLI parsing.

Commander is allowed by the dependency policy under CLI parsing and does not change the MVP runtime trust boundary.

## File Write Impact

P5 creates one combined write plan for config and generated docs.

If the plan has errors, no files are written.

All writes go through `core/filesystem`.

## Security Impact

P5 expands the attack surface to CLI arguments and generated init destinations.

Controls:

- Preset IDs are validated by the registry.
- Output destinations are validated through safe write planning.
- Existing files skip by default.
- Force is explicit.
- Dry run writes nothing.

## ADR Impact

No new ADR is required.

The existing architecture already defines SpecForge as a local-first CLI and identifies Commander as the CLI framework.
