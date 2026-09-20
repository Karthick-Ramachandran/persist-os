# Skills Decisions

## ADR-0008/ADR-0012: Three Rewritten Skills, Scripts Allowed

The portable-and-scriptless decision is superseded. The catalog is three skills rewritten from
scratch with earned sections and WHAT/WHEN descriptions; scripts are opt-in per skill under
the four ADR-0012 constraints, verified by tests that fail loudly.

## Dual Target

The identical skill is written to `.claude/skills/<name>/SKILL.md` and
`.agents/skills/<name>/SKILL.md`.

## Trigger Descriptions

Descriptions include "Use when" language so agents invoke skills at the right moment, per the
official Agent Skills guidance.
