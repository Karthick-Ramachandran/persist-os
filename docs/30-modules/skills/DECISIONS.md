# Skills Decisions

## ADR-0004: Portable And Scriptless

Generated skills use only standard Agent Skills fields and contain no scripts, so the same SKILL.md
works across Claude Code and other compatible tools.

## Dual Target

The identical skill is written to `.claude/skills/<name>/SKILL.md` and `.agents/skills/<name>/SKILL.md`.

## Trigger Descriptions

Descriptions include "Use when" language so agents invoke skills at the right moment, per the official
Agent Skills guidance.
