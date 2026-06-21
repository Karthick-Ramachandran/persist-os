# Architecture Impact: Pre Push Regression Gate

## Summary

Additive: one new generated hook file. No new ADR — it mirrors the accepted pre-commit hook pattern
(ADR-0002) at the pre-push event. No config schema change (reuses `preCommitGates`).

## Touched

- `src/core/hooks/generate-hook.ts` — `PRE_PUSH_HOOK_PATH` + `renderPrePushHook`.
- `src/commands/init.ts` — emit the pre-push hook; mention it in the result.
- `src/core/generator/generate-init.ts` + `README.md` — documentation.
- `tests/golden/generated-generic.test.ts` — new file added to the exact list.

## Invariants preserved

- Hooks are never auto-activated; existing pre-commit hook unchanged; deterministic, local, offline.
