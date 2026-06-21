# Completion Report: Pre Push Regression Gate

## Status

Complete.

## Files Changed

- `src/core/hooks/generate-hook.ts` — `PRE_PUSH_HOOK_PATH` + `renderPrePushHook`.
- `src/commands/init.ts` — emit the pre-push hook; updated init messaging.
- `src/core/generator/generate-init.ts`, `README.md` — documentation.
- `tests/golden/generated-generic.test.ts` — new file added to the exact list.
- `tests/integration/init-command.test.ts` — asserts both hooks.
- `tests/unit/hooks/generate-hook.test.ts` — new `renderPrePushHook` tests.
- `examples/*/.recall/hooks/pre-push` — refreshed.

## Tests Run

- `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm pack:check`.
- `recall doctor` on this repository.

## Results

- 271 tests pass (56 files), including 4 new `renderPrePushHook` tests.
- typecheck, lint, format pass.
- Regression proof: default `init` output differs from published 0.3.1 by exactly one added file
  (`.recall/hooks/pre-push`) — nothing else changed.

## Skipped

- A separate `prePushGates` config field (reuses `preCommitGates` for v1).

## Remaining Risks

- Follow-up: a `prePushGates` split (heavy suite at push, light checks at commit) and a "code changed
  without tests" heuristic — separate, later tasks.
