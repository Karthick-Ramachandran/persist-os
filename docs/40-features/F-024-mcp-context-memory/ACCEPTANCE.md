# Acceptance Criteria: MCP Context Memory

## Command

- `recall mcp add <server>` writes `docs/ai/mcp/<server>.md` and
  `docs/adrs/proposed/ADR-PROPOSED-mcp-<server>.md`.
- `--dry-run` writes nothing; existing files are skipped unless `--force`.
- An invalid server name is rejected with a clear error.

## Content

- The MCP memory doc includes Purpose, Data Accessed, Permissions Required, Security Risks,
  Source-Of-Truth Rule, Captured Context, and Review Cadence sections.
- `recall mcp add figma` pre-fills a design-context purpose and data hints.
- The Captured Context section states that recorded context is proposed and must be reviewed.
- The generated ADR has `## Status` set to `Proposed`.

## Offline And Safety

- The command makes no network calls and does not connect to any MCP server.
- Writes resolve inside the project root and reuse symlink and path-traversal protection.
- Works with or without an existing Recall config, using default paths when none is present.

## Regression

- The full test suite passes and Doctor still passes.
