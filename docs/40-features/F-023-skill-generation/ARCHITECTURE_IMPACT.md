# Architecture Impact: Skill Generation

## Affected Modules

- `cli`: registers `recall skill create` and `recall skill list`.
- `skills` (new): skill catalog, rendering, and generation.

Reuses `filesystem` (write pipeline) and `naming` (slugify) only.

## New Behavior

- New `src/core/skills/skill-catalog.ts`, `render-skill.ts`, and `generate-skill.ts`.
- New `src/commands/skill/create.ts` and `src/commands/skill/list.ts`.
- `recall skill create <name>` writes a valid SKILL.md to both skill targets, non-destructively.

## Decision Records

- Governed by ADR-0004 (Skill Generation Is Portable And Scriptless), which is accepted.

## Security Impact

- Generated skills contain no scripts and no executable code; they are plain Markdown instructions.
- Writes reuse the safe pipeline: confined to the project root, symlink-protected, non-destructive by
  default.
- No network, telemetry, dependency, or runtime agent behavior is added.

## Compatibility

- Adds `.claude/skills/` and `.agents/skills/` artifacts; existing files are never overwritten by
  default.
- Generated skills use only standard Agent Skills fields, so they work across compatible tools.
