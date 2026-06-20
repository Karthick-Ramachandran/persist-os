# Security Model

## Security Promise

SpecForge MVP is local-first and deterministic.

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

AI agents may draft plans, reviews, tests, and docs. Humans own architecture decisions, risk acceptance, and releases.
