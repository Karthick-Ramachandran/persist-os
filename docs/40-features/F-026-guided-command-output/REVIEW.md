# Review: Guided Command Output

## Status

Passed.

## Scope Review

- Presentation-only: a shared `appendNextSteps` helper and one guidance block per create command.

## Correctness Review

- Guidance names the real artifact path and the next action for each command.
- Guidance is gated on non-dry-run, so dry-run output is unchanged.

## Dogfooding Review

### Did the workflow catch any issue?

The change came from real usability feedback: a bare list of created paths does not teach a new user
what the tool did. Guided output makes each command self-explaining and consistent across the CLI.

### What should Recall OS improve before public release?

Consider optional interactive prompts behind a flag, which would need a dependency decision and an
ADR.
