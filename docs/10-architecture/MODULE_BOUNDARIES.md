# Module Boundaries

## Principle

Command code should orchestrate. Core modules should own decisions and be testable without shelling out to the CLI.

## Boundaries

`cli`

- Owns command registration, output formatting, exit codes, and top-level error handling.
- Does not own file write rules or generation rules.

`commands`

- Own command-specific flow.
- Call core modules for validation, generation, and write planning.

`core/config`

- Owns `.specforge/config.json` schema, defaults, load, and write.
- Must not store secrets.

`core/filesystem`

- Owns safe path validation, conflict policy, write plans, and safe writes.
- Must not know about specific document templates.

`core/generator`

- Owns template rendering and generation plans.
- Must not write files directly.

`core/presets`

- Owns preset/opinion-pack schemas, registry, and validation.
- Must validate output paths before they reach write execution.
- Must not treat preset suggestions as accepted architecture decisions.

`core/doctor`

- Owns repository health checks.
- Must report actionable findings without mutating files.

`core/security`

- Owns reusable security checks that protect filesystem and input handling.

## Dependency Direction

Commands may depend on core modules.

Core modules must not depend on command implementations.

Template rendering must not bypass filesystem write policy.
