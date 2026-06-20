# Architecture Impact: Feature Create Command

## Affected Modules

- `cli`
- `commands`
- `core/config`
- `core/filesystem`
- `core/generator`
- `core/naming`
- `feature-workflow`

## New Behavior

P6 adds command orchestration for feature memory creation.

Command code loads config, calls naming/generator/filesystem modules, and formats output.

Feature creation is idempotent by slug. If `F-###-auth-provider` already exists, `feature create auth-provider` targets that folder and lets the write policy skip or overwrite existing files. New feature slugs receive the next number after the highest valid feature folder.

## Module Boundary Check

- `core/naming` owns slug safety, feature number scanning, and existing feature folder resolution.
- `core/generator` owns deterministic feature document plans.
- `core/filesystem` owns safe write planning and execution.
- `cli` owns command registration and output routing.
- `commands` owns orchestration.

## Dependency Impact

No dependency is added.

## File Write Impact

Feature creation uses one safe write plan.

If the plan has errors, execution refuses to write.

## Security Impact

User-provided feature names are a trust boundary.

Controls:

- unsafe names are rejected through `slugify`
- destinations are validated through safe write planning
- existing files skip by default
- dry run writes nothing
- force is explicit

## ADR Impact

No new ADR is required.

P6 implements documented feature workflow behavior without changing the architecture model.
