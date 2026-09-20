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

## F-037: Fourth Skill — Chesterton's Fence

The catalog goes three to four with `chestertons-fence`: the reasoning half of ADR-0010. Three
questions (which files, what logic and why, what might break), one for bug fixes, human-confirmed
reasons written to `FENCES.md` in the greppable shape the SessionStart index reads. Scriptless by
design — nothing here needs executing. Trigger terms (`chesterton`, `fence crossing`, `fences.md`)
are covered both directions by the routing test, including the anti-steal rule against the other
three skills' terms.
