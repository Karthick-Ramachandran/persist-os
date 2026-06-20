# Acceptance Criteria: Engineering Standards Memory

## Structure

- `docs/60-engineering/ENGINEERING_STANDARDS.md` exists.
- `docs/60-engineering/AI_AGENT_RULES.md` exists.
- `docs/60-engineering/CODE_REVIEW_RULES.md` exists.
- No additional split-out engineering standards docs are created in P1.6.

## Semantics

- Engineering Standards Memory answers: “How must work be done in this repo?”
- Architecture remains higher than standards in source-of-truth order.
- Repository rules override model preferences.
- Standards cover secrets, dependencies, documentation, git, releases, migrations, operations, and AI agent behavior.

## Integration

- Memory model docs include Engineering Standards Memory.
- Product docs describe SpecForge as an Engineering Memory Operating System.
- Agent routing docs point to engineering standards.
- Review and drift docs include standards violations.

## Verification

- Existing tests pass.
- Typecheck passes.
- Manual docs review confirms no runtime behavior changed.
