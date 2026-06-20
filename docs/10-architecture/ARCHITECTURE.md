# SpecForge Architecture

## Purpose

SpecForge is a local-first CLI that initializes and maintains AI-ready engineering memory inside a repository.

It generates durable documents, templates, and agent guidance. It does not generate production application code and does not run AI agents in the MVP.

SpecForge Core is architecture-neutral. It records, distributes, validates, and protects architecture decisions; it does not decide which architecture, stack, vendor, or infrastructure a repository should use.

SpecForge initializes repository memory. It does not require application code to exist first.

## Architectural Style

SpecForge should be a deterministic TypeScript CLI with a small core and declarative generation model.

Core responsibilities:

- Validate user input and config.
- Build a safe write plan.
- Render deterministic templates.
- Apply non-destructive file writes.
- Report clear CLI results.
- Run repository health checks.

`specforge init` should work in empty folders, existing repositories, and non-Git directories. Git is recommended for normal development but is not required for repository memory initialization.

The command layer should orchestrate behavior. Core modules should contain the business rules and be testable without invoking the CLI process.

## MVP Runtime Boundary

MVP runtime must remain local and deterministic:

- No network calls.
- No telemetry.
- No AI API calls.
- No runtime MCP.
- No remote templates.
- No dependency installation inside target repositories.
- No generated production app code.

## Primary Modules

- `cli`: command registration, output, exit codes, and top-level errors.
- `commands`: command-specific orchestration for init, feature, ADR, module, preset, and doctor flows.
- `core/config`: config schema, defaults, load, and write behavior.
- `core/filesystem`: safe path validation, write planning, conflict policy, and safe writes.
- `core/generator`: template rendering and document generation flows.
- `core/presets`: preset/opinion-pack registry and validation.
- `core/doctor`: repository health checks and reports.
- `core/naming`: slug, title, feature number, and ADR number helpers.
- `core/security`: path, symlink, and unsafe input policy helpers.

## Source Of Truth

The repository memory is the durable source of truth. Chat history is never authoritative.

Order:

1. Accepted ADRs and repository decisions
2. Architecture docs
3. Engineering standards
4. Current PRD and accepted change requests
5. Security and testing docs
6. Module docs
7. Feature plans
8. Task files
9. MCP external context
10. Chat history

If documents conflict, implementation must stop until the conflict is resolved.

## Architecture Change Rule

Architecture change is allowed. Undocumented architecture change is drift.

Create or update an ADR when changing:

- Runtime architecture.
- File write policy.
- Security posture.
- Network behavior.
- Telemetry behavior.
- Auth, secrets, storage, or dependency policy.
- Preset or plugin execution model.
- MCP from guidance-only to active workflow dependency.
