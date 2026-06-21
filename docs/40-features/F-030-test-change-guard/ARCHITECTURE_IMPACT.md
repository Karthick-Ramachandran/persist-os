# Architecture Impact: Test Change Guard

## Summary

Additive new command. First feature to read `git diff` (read-only, local, deterministic, graceful on
non-git dirs) — consistent with the no-network bet. No config schema change; opt-in via gate args.

## Touched

- New `src/core/naming/test-files.ts` (shared `isTestFile` + patterns).
- `src/core/adopt/inspect-repo.ts` — imports the shared patterns (no behavior change; adopt tests stay green).
- New `src/commands/guard.ts`; `src/cli/main.ts` wiring.
- Docs: README + generated RECALL_COMMANDS.

## Invariants preserved

- Deterministic and offline; `recall doctor` stays git-unaware (the diff logic lives in `guard`, not doctor).
