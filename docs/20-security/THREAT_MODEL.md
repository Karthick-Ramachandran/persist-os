# Threat Model

## Assets

- User repository files.
- Local filesystem outside the repository.
- Project secrets and environment files.
- Generated engineering memory.
- Trust in generated agent instructions.
- Release artifacts published to npm.

## Attack Surfaces

- CLI arguments.
- Config files.
- Preset definitions.
- Template destination paths.
- Existing filesystem state.
- Symlinks.
- Future plugin and MCP configuration.
- npm package supply chain.

## MVP Threats

Path traversal:

- A malicious name tries to write outside the project root.
- Control: reject traversal and absolute destinations.

Unsafe overwrite:

- Init or generation replaces user files.
- Control: skip existing by default and require explicit force.

Symlink write:

- A generated output path points through a symlink to a sensitive location.
- Control: refuse unsafe symlink writes by default.

Template injection:

- User input is rendered into templates in a way that executes logic.
- Control: deterministic templates, escaped values where appropriate, no user-provided template execution in MVP.

Secret exposure:

- CLI reads or copies `.env` or credentials into generated docs.
- Control: do not read `.env`; do not collect secrets.

Supply chain risk:

- Dependency or publish process introduces hidden behavior.
- Control: small dependency set, lockfile, CI, npm package audit before release.

MCP prompt injection:

- Future external context attempts to override repo memory.
- Control: MCP is context only; accepted docs remain authoritative.

## Out Of Scope For MVP

- Runtime MCP security enforcement.
- Remote plugin registry security.
- Cloud execution.
- Enterprise policy management.
- AI model safety controls.
