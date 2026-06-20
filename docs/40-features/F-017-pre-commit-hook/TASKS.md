# Tasks: Pre-Commit Hook Generation

Build one task at a time. Do not start the next task until the current task has completion evidence.

## T1: Plan and decision

- Status: Complete.
- Scope: PRD, acceptance, architecture impact, and ADR-0002 for hook generation.
- Acceptance: Design keeps neutrality, non-destructive writes, and no silent git mutation.
- Do not: Encode a toolchain into core.

## T2: Config and safe executable write

- Status: Complete.
- Scope: `preCommitGates` config field and executable support in the safe writer.
- Acceptance: Field validates; executable files write with mode `0o755` inside the root only.
- Tests: Config schema and filesystem unit tests.
- Do not: Allow multi-line gates or writes outside the root.

## T3: Detection and hook rendering

- Status: Complete.
- Scope: `src/core/hooks/detect-gates.ts` and `src/core/hooks/generate-hook.ts`.
- Acceptance: Neutral detection seeds proposed gates; hook renders `recall doctor` plus gates.
- Tests: Unit tests for detection and rendering.
- Do not: Execute repository content during detection.

## T4: Init wiring

- Status: Complete.
- Scope: Seed gates, add the executable hook to the init write plan, print the activation proposal.
- Acceptance: Init creates the hook by default and stays non-destructive.
- Tests: Init integration tests and updated golden file lists.
- Do not: Run `git config`.

## T5: Docs, examples, memory, completion

- Status: Complete.
- Scope: Module memory, product docs, regenerated examples, review, and completion report.
- Acceptance: All quality gates recorded with results.
- Tests: Full suite, typecheck, lint, format, build, pack, and `recall doctor`.
- Do not: Claim completion without evidence.
