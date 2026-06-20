# PRD: Pre-Commit Hook Generation

## Purpose

Make `recall doctor` enforceable at commit time. Today Doctor only runs when someone remembers to
run it. A generated git pre-commit hook lets the repository block commits that fail Doctor or the
repository's own gates.

This advances Product Vision Level 3 (AI completion gate) and Level 5 (context distribution) by
distributing an enforced gate into the developer's git workflow.

## Problem

- Repository memory can drift or lose evidence between commits with nothing stopping it.
- Doctor is read-only and useful, but it is opt-in.
- Teams want the gate to run automatically without encoding their toolchain into a neutral tool.

## In Scope

- Generate a tracked pre-commit hook at `.recall/hooks/pre-commit` during `recall init`.
- Run `recall doctor` plus a configured `preCommitGates` list from `.recall/config.json`.
- Seed `preCommitGates` from neutral, proposed toolchain detection.
- Propose, but never run, `git config core.hooksPath .recall/hooks`.
- Keep generation non-destructive: skip an existing hook unless `--force`.
- Add the `preCommitGates` config field with validation.
- Add the ability to write an executable file safely within the project root.

## Non-Goals

- No writing into `.git/hooks`.
- No automatic `git config` mutation.
- No hardcoded toolchain commands in the hook.
- No installation of dependencies into the target repository.
- No network, telemetry, MCP runtime, AI API, or cloud behavior.
- No new `recall hooks` subcommand in this feature.

## Users

- Maintainers who want Doctor enforced before commits.
- AI agents whose commits should pass the gate.
- Teams that want shared, reviewable hooks committed to the repository.

## Success Criteria

- `recall init` creates an executable `.recall/hooks/pre-commit`.
- The hook runs `recall doctor` and each configured gate.
- `preCommitGates` is seeded by detection as proposed values and is editable.
- Detection stays neutral: no toolchain is encoded into core; an undetected toolchain yields an
  empty gate list.
- `recall init` prints the activation command and does not run it.
- An existing hook is skipped unless `--force`.
- The hook never writes outside `.recall/hooks` and never escapes the project root.
