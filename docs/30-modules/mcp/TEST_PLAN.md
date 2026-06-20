# MCP Test Plan

## Unit Tests

- Figma pre-fills a design-context purpose and the memory doc has all template sections.
- The generated ADR is `Proposed`.
- An unknown server uses a usable template.

## Integration Tests

- `recall mcp add figma` writes the memory doc and proposed ADR without an existing config.
- `--dry-run` writes nothing; existing files are skipped unless `--force`.

## Safety

- The command performs no network calls; it only renders and writes static content.

## Results

- Covered by `tests/unit/mcp/generate-mcp.test.ts` and `tests/integration/mcp-command.test.ts`.
