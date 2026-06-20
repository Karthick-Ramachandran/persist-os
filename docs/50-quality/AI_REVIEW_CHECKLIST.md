# AI Review Checklist

## Purpose

AI review should catch missing reasoning, unsafe behavior, weak tests, and stale docs. It should not merely summarize the diff.

## Review Questions

- Does the change satisfy the linked PRD or task?
- Did the implementation preserve file write safety?
- Did the implementation follow engineering standards?
- Did it add or change dependencies?
- Did it change security posture?
- Did it update tests based on risk?
- Did it update generated output snapshots intentionally?
- Did it update module docs when behavior changed?
- Did it introduce architecture drift?
- Are errors clear and actionable?
- Is completion evidence present?

## Finding Types

- Product gap
- Architecture drift
- Security risk
- Test gap
- Documentation gap
- Engineering standards violation
- CLI UX issue
- Release blocker

## Output Standard

Findings should be concrete, scoped, and tied to files or docs where possible.

Do not produce vague findings like "improve quality" without a specific failure and expected fix.
