# Release Checklist

## Release Gate

A release requires evidence for build, tests, security posture, generated output, package contents, and documentation.

## Required Evidence

- Version selected.
- Changelog or release notes drafted.
- Lint passed.
- Typecheck passed.
- Unit tests passed.
- Integration tests passed.
- Security tests passed.
- Golden tests passed or snapshots updated intentionally.
- Package build passed.
- npm package contents reviewed.
- README quickstart verified.
- Known risks documented.

## Blockers

Do not release if:

- File writes can escape the project root.
- Existing files are overwritten by default.
- Runtime network calls exist in MVP.
- Telemetry exists in MVP.
- Generated docs are stale or misleading.
- Skill templates encourage tool execution or scripts in MVP.
- MCP is treated as source of truth.
