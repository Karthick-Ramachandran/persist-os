# Acceptance Criteria: Init Command

## Command Behavior

- `init` creates `.specforge/config.json`, `AGENTS.md`, `CLAUDE.md`, and neutral repository memory docs.
- `init` works in an empty folder.
- `init` works outside Git repositories.
- `init --preset <id>` uses the built-in preset registry.
- `init --preset <id>` records the selected preset in config.
- Unknown presets fail with clear output and no writes.
- `init --dry-run` performs validation and writes nothing.
- `init --force` overwrites explicitly.
- Existing files are skipped by default.

## Generated Memory

- Neutral init creates concise placeholder docs under product, architecture, security, quality, engineering, AI, and ADR directories.
- Neutral init does not choose architecture, framework, database, vendor, hosting, or state management.
- Preset guidance remains optional.
- Preset proposed decisions remain proposed.
- No preset output is treated as accepted repository memory.

## Runtime Boundary

- No package `bin` is added.
- No build/release tooling is added.
- No technology detection is added.
- No template files are loaded from disk.
- No network, telemetry, MCP runtime, AI API, or cloud behavior is added.
- No production app code is generated.
