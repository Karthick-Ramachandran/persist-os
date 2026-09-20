# Module: Skills

## Purpose

Skills owns generation of portable AI agent skills for a repository.

## Owns

- The built-in skill catalog (three rewritten workflow skills).
- Rendering a skill definition into a valid Agent Skills SKILL.md with earned sections only.
- Dual-target generation to `.claude/skills/` and `.agents/skills/`, including optional
  skill `scripts/` through the safe write pipeline.
- The `persist skill create` and `persist skill list` commands.

## Does Not Own

- Running agents or skills.
- Claude Code-only skill features.
- The write pipeline (reused from `filesystem`) or slugify (reused from `naming`).

## Public Interfaces

- `SKILL_CATALOG`, `getCatalogSkill`, `listCatalogSkillNames`
- `renderSkill`
- `generateSkillFiles`, `SKILL_TARGETS`
- `createSkill`, `formatSkillCreateResult`, `formatSkillListResult`

## Boundaries

Skills produces Markdown instructions plus optional read-only, local scripts. Scripts ride the
safe, non-destructive pipeline and a skill always works with its scripts deleted.

## Current Decision

Governed by ADR-0008 and ADR-0012 (the scriptless-skills decision is superseded). Generated skills use only standard
Agent Skills fields, include WHAT/WHEN trigger descriptions, ship scripts only per skill under
the four ADR-0012 constraints, and are written identically to both skill targets.
