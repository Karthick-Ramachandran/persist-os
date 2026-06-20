# Architecture Impact: Engineering Standards Memory

## Affected Areas

- Repository memory model.
- Product positioning.
- Agent routing.
- Review and drift workflows.
- Project structure docs.

## Runtime Impact

No runtime impact.

P1.6 is docs-only.

## Source-Of-Truth Impact

The source-of-truth order becomes:

1. Accepted ADRs and repository decisions
2. Architecture docs
3. Engineering standards
4. Current PRD and accepted change requests
5. Security and testing docs
6. Module docs
7. Feature plans
8. Task files
9. MCP external context
10. Chat history

## ADR Impact

No ADR is required for P1.6 because this is a product/memory-model documentation change without runtime architecture change.

Future enforcement, doctor checks, or template generation for engineering standards may require ADR review.
