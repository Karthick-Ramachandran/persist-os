# Architecture Impact: Module Create Command

## Affected Modules

- `cli`
- `commands`
- `core/config`
- `core/filesystem`
- `core/generator`
- `core/naming`
- `module-workflow`

## New Behavior

P8 adds command orchestration for module memory creation.

Command code loads config, calls naming/generator/filesystem modules, and formats output.

P8 also extracts repeated write-summary output formatting into a small command helper without changing command behavior.

## Module Boundary Check

- `core/naming` owns slug safety.
- `core/generator` owns deterministic module document plans.
- `core/filesystem` owns safe write planning and execution.
- `cli` owns command registration and output routing.
- `commands` owns orchestration and command result formatting.

## Dependency Impact

No dependency is added.

## File Write Impact

Module creation uses one safe write plan.

If the plan has errors, execution refuses to write.

## Security Impact

User-provided module names are a trust boundary.

Controls:

- unsafe names are rejected through `slugify`
- destinations are validated through safe write planning
- existing files skip by default
- dry run writes nothing
- force is explicit

## ADR Impact

No new ADR is required.

P8 implements documented module memory behavior without changing architecture policy.
