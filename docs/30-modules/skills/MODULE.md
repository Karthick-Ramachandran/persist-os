# Module: Skills

## Purpose

Skills owns generation of portable, scriptless AI agent skills for a repository.

## Owns

- The built-in skill catalog (the documented MVP workflows).
- Rendering a skill definition into a valid Agent Skills SKILL.md.
- Dual-target generation to `.claude/skills/` and `.agents/skills/`.
- The `recall skill create` and `recall skill list` commands.

## Does Not Own

- Running agents or skills.
- Scripts or Claude Code-only skill features.
- The write pipeline (reused from `filesystem`) or slugify (reused from `naming`).

## Public Interfaces

- `SKILL_CATALOG`, `getCatalogSkill`, `listCatalogSkillNames`
- `renderSkill`
- `generateSkillFiles`, `SKILL_TARGETS`
- `createSkill`, `formatSkillCreateResult`, `formatSkillListResult`

## Boundaries

Skills produces Markdown instructions only. It never generates executable code and writes through the
safe, non-destructive pipeline.

## Current Decision

Governed by ADR-0004. Generated skills use only standard Agent Skills fields, include "Use when"
trigger descriptions, contain no scripts, and are written identically to both skill targets.
