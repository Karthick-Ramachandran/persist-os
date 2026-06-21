# PRD: Pre Push Regression Gate

## Purpose

Touching code can break something elsewhere. `recall init` already generates a pre-commit hook that
runs `recall doctor` plus configured gates, but a commit can bypass it (`--no-verify`, another
machine, or before the hook was activated). This feature adds a generated `.recall/hooks/pre-push`
hook: the final regression gate that runs `recall doctor` and the configured gates against everything
about to be pushed — so broken code does not leave the machine.

## In Scope

- Generate `.recall/hooks/pre-push` from `config.preCommitGates` (runs `recall doctor` + the gates).
- Activated by the same `git config core.hooksPath .recall/hooks` step (no extra activation).
- Document it (README + generated RECALL_COMMANDS.md) and mention it in the init output.

## Non-Goals

- A separate `prePushGates` config field (reuse `preCommitGates` for v1; a split is a later task).
- Running or interpreting tests in Recall itself — the hook runs the user's command; the user's suite
  catches regressions. Recall provides the gate, not the test intelligence.
- A "code changed without tests" heuristic (separate, later task).
