# Plan: Skill Generation

## Approach

Add a `skills` concern (catalog + render + generate) and a thin `recall skill` command group, reusing
the safe write pipeline. Skills are portable and scriptless (ADR-0004).

## Steps

1. `skill-catalog.ts`: the documented MVP skills as structured data with "Use when" descriptions.
2. `render-skill.ts`: render a definition into a valid SKILL.md.
3. `generate-skill.ts`: emit identical content to both skill targets; skeleton for unknown names.
4. `commands/skill/create.ts` and `commands/skill/list.ts`; register in the CLI.
5. Add unit and integration tests.
6. Dogfood: regenerate the repository's own skills from the catalog.

## Out Of Scope

- Scripts and Claude Code-only fields.
- MCP context-capture skills (separate feature).
