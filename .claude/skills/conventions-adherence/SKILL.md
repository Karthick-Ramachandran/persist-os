---
name: conventions-adherence
description: "Check a change against the repository's naming conventions and canonical vocabulary instead of reinventing patterns. Use when reviewing a finished change, or before finishing one, to verify it reuses what CONVENTIONS.md names. Skip for planning work, security reviews, and writing new tests."
---

# Goal

Verify a change reuses the repository's named vocabulary instead of inventing new patterns.

## Workflow

1. Review with fresh context: a separate pass from the one that wrote the change.
2. Read the Canonical Primitives, Naming Conventions, Rules, and Anti-Patterns sections of CONVENTIONS.md.
3. For each new component, helper, client, type, or pattern, check whether a named primitive already exists.
4. Check naming against the documented conventions.
5. Flag reinvention, divergent naming, and anti-pattern use, each naming the primitive or rule.
6. Propose a CONVENTIONS.md update when the change establishes a genuinely new shared primitive.

## Decisions

- If CONVENTIONS.md is missing or still a template → report that first; there is nothing to review against.
- If a convention conflicts with an accepted ADR → the ADR wins; stop and ask for a human decision.

## Verification

- Every finding cites a specific primitive, naming rule, or anti-pattern.
- Reinvention of an existing primitive is caught or explicitly absent.
- New shared primitives are proposed for documentation, not silently accepted.

## Resources

- For the vocabulary → docs/60-engineering/CONVENTIONS.md
- For past mistakes → docs/60-engineering/LESSONS.md

## Output

- Finding list citing primitives or rules, or an explicit all-clear.
- Proposed CONVENTIONS.md update when one earned it.

