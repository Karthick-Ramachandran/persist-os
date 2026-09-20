---
name: conventions-adherence
description: "Review a change for reuse of the repository's canonical vocabulary instead of reinventing components, helpers, or patterns. Use when reviewing a change, or before finishing one, to check it follows the repository conventions."
---

# Skill: Conventions Adherence

## Purpose

Keep AI output consistent by reusing the named primitives and rules the repository already defined, instead of inventing new ones.

Adherence is measured against this repository's own CONVENTIONS.md, not against any Persist OS preference. Persist OS is architecture-neutral.

## Inputs

- Change summary or diff.
- The repository conventions.
- Relevant feature, module, and architecture docs.

## Required Reading

- `docs/60-engineering/CONVENTIONS.md`
- `docs/60-engineering/ENGINEERING_STANDARDS.md`
- `docs/60-engineering/LESSONS.md`
- Relevant `docs/30-modules/<module>/MODULE.md`

## Output Files

- Relevant feature `REVIEW.md`
- A proposed `docs/60-engineering/CONVENTIONS.md` update when a new canonical primitive or rule is genuinely established (human accepts it).

## Process

1. Review with fresh, independent context — a separate pass, or a dedicated sub-agent if your tool supports one — rather than continuing in the same chat that wrote the change, so the review is not biased by the work it checks.
2. Read CONVENTIONS.md so you know the canonical primitives, naming, rules, and anti-patterns.
3. For each new component, helper, client, type, or pattern in the change, check whether a canonical primitive already exists that should have been reused.
4. Check naming against the documented conventions.
5. Check the change against the falsifiable rules and anti-patterns.
6. Flag reinvention of an existing primitive, divergent naming, and anti-pattern use as findings, each naming the primitive or rule that applies.
7. If the change establishes a genuinely new shared primitive or rule, propose adding it to CONVENTIONS.md rather than leaving it undocumented.

## Stop Conditions

Stop and request human decision if:

- CONVENTIONS.md is missing or still an unfilled template, so there is nothing to review against — report that the conventions need to be filled first.
- Following a convention would conflict with an accepted ADR or engineering standards.

## Quality Bar

- Findings cite a specific primitive, naming rule, or anti-pattern from CONVENTIONS.md.
- Reinvention of an existing primitive is caught.
- New shared primitives are proposed for documentation, not silently accepted.
- Findings reflect this repository's conventions, not Persist OS preferences.
