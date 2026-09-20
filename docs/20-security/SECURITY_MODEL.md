# Security Model

## Security Promise

Persist OS MVP is local-first and deterministic.

It must not:

- Call remote services.
- Send repository contents anywhere.
- Collect telemetry.
- Read `.env` files.
- Collect secrets.
- Require API keys.
- Execute remote templates.
- Run hidden background processes.
- Install dependencies in target projects.

## Trust Boundaries

Primary trust boundaries:

- User-provided names and paths.
- Existing repository files.
- Generated output destinations.
- Symlinks and filesystem metadata.
- Preset definitions.
- Template rendering.
- Future MCP external context.

## Primary Risks

- Path traversal.
- Unsafe overwrites.
- Symlink writes.
- Template injection.
- Malicious preset definitions.
- Accidental secret exposure.
- Supply chain compromise.
- MCP prompt injection in future workflows.

## Security Controls

MVP must use:

- Strict safe path validation.
- Non-destructive write policy.
- Dry-run support.
- Explicit force overwrite.
- Schema validation for config and presets.
- Golden tests for generated output.
- Security tests for malicious inputs.
- Clear docs that generated files are guidance, not enforcement.

## Human Authority

AI agents may draft plans, reviews, tests, and docs. Humans own architecture decisions, risk
acceptance, and releases.

## Executable Generated Output

Generated skills may ship a `scripts/` directory (ADR-0012). The same local-first
promise applies to those executables:

- Scripts are opt-in per skill, never per repository: nothing executable is written
  unless the skill that needs it is generated, and `persist init` names every
  executable file it wrote.
- Scripts are read-only and local: no network calls, no telemetry, no AI API calls,
  and no writes outside the repository root — verified by test, not by convention.
- A skill must work with its `scripts/` directory deleted: the `SKILL.md` workflow
  states what each script does, so deletion degrades to the prose path.
- Scripts travel through the same safe, root-confined, never-overwrite-by-default
  write pipeline as every other generated file.
