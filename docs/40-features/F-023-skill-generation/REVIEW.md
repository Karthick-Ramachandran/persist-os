# Review: Skill Generation

## Status

Passed.

## Scope Review

- Adds a `skills` concern and a `recall skill` command group. Reuses the write pipeline and slugify.

## Correctness Review

- Generated skills are valid Agent Skills: standard fields only, name regex enforced, "Use when"
  descriptions, no scripts.
- Identical content is written to both targets.
- Unknown names render a valid skeleton.

## Security Review

- No executable code is generated. Writes are confined to the project root and non-destructive.

## Dogfooding Review

### Did the workflow catch any issue?

The research step confirmed the official format and surfaced the "Use when" trigger requirement,
which improved every generated description over the prior hand-authored ones. The repository's own
skills are now generated from the catalog rather than hand-authored.

### What should Recall OS improve before public release?

Add MCP context-capture skills (for example a design-context skill for Figma) so MCP-derived context
is recorded into durable memory, under the same portable, scriptless rules.
