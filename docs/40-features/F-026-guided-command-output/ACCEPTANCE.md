# Acceptance Criteria: Guided Command Output

- `recall init` prints a "Next steps" block pointing at CLAUDE.md/AGENTS.md and the first commands.
- `recall adr create` names the ADR file and the sections to fill, and notes it is Proposed.
- `recall feature create` points at PRD.md and ACCEPTANCE.md and suggests `recall doctor`.
- `recall module create` points at MODULE.md and DECISIONS.md.
- `recall skill create` states where the skill is and whether to fill it (skeleton) or load it
  (catalog).
- `recall mcp add` points at the memory doc and the capture skill and the proposed ADR.
- `recall adopt` points at the adoption report and the proposed ADRs.
- No "Next steps" block is printed on a dry run.

## Regression

- The full test suite passes and Doctor still passes.
