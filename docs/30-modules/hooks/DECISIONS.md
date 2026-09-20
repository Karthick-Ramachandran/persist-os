# Hooks Decisions

## ADR-0002: Tracked Pre-Commit Hook

The pre-commit hook is tracked at `.persist/hooks/pre-commit`, not written into `.git/hooks`, so it
is shared and reviewable.

## Neutral Detection Only

Detected toolchain commands are written into `.persist/config.json` as proposed, editable
`preCommitGates`. They are never hardcoded into core. An undetected toolchain yields an empty list,
and the hook then runs only `persist doctor`.

## Warnings Advisory, Errors Blocking (ADR-0013)

The hook continues on doctor exit 0 (pass) and exit 1 (warnings) and fails only on exit 2
(errors). Warnings advise; they never block the commit. The `set +e` / `set -e` pair around the
doctor invocation is deliberate — under `set -e` the shell aborts before `$?` can be read — and
doctor's output is never redirected, because warnings nobody can see are invisible, not advisory.
No config knob selects the old behaviour: teams who want warnings to block add `persist doctor`
to their own `preCommitGates`, where `set -e` gives them exactly that.

## No Git Mutation

`persist init` proposes `git config core.hooksPath .persist/hooks` and never runs it. Activation
stays a deliberate human step.

## Trust Boundary

`preCommitGates` are executed by the hook as written. They are user-authored and trusted like
`package.json` scripts. The config schema rejects multi-line and control characters.

## Hook Split By Cost (ADR-0009)

Pre-commit runs doctor plus `preCommitGates`; pre-push runs `persist test-gate` plus `prePushGates`
and never doctor. Doctor twice is repetition, not extra safety; ~1.7s commits keep the hooks enabled
where ~10s commits invite `--no-verify`.

## One-Shot Detection

`detectTestCommand` prefers `test:run` over `test` and never selects a watch-mode runner (bare
`vitest`, any `--watch` flag). No `package.json`, or nothing safe to pick, yields null rather than a
guess — a loud unconfigured gate beats a hanging hook.

## Test Command Not Repeated In Push Gates

`detectPrePushGates` returns typecheck/lint only. The hook runs the test command via
`persist test-gate`; baking it into the gate list too would run the suite twice.

## Fence Index in SessionStart (ADR-0010)

The SessionStart hook injects the fence index — `## <path>` / `Why:` lines from `FENCES.md`,
flattened to one JSON-escaped line — never the crossing history. Room is the 24KB budget minus
the agent files minus the base context minus the index label, so files plus the whole injection
stay within budget; a truncated index carries a marker naming the file. A missing or
crossingless `FENCES.md` injects nothing.
