# Review: MCP Context Memory

## Status

Passed.

## Scope Review

- Adds an `mcp` concern and a `recall mcp add` command. Reuses config loading and the write pipeline.

## Correctness Review

- Generates a memory doc with all template sections and a proposed adoption ADR.
- Well-known servers pre-fill purpose and data hints; unknown servers use a usable template.
- The ADR and captured context are proposed, not accepted.

## Security Review

- The command is offline: no network calls, no MCP connection, no live data import (ADR-0005).
- Writes are confined to the project root and non-destructive by default.
- The generated memory documents least-privilege and untrusted-content rules.

## Dogfooding Review

### Did the workflow catch any issue?

Writing ADR-0005 first kept the offline, proposed-only boundary explicit, so the generator never
imports live data or produces accepted memory.

### What should Recall OS improve before public release?

Add a `capture-mcp-context` agent skill so agents are reliably prompted to record MCP-derived context
into the generated memory, reusing skill generation under the same portable, scriptless rules.
