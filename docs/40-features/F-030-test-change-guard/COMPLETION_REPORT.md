# Completion Report: Test Change Guard

## Status

Complete.

## Files Changed

- New `src/core/naming/test-files.ts` (shared `isTestFile` + `TEST_FILE_PATTERNS`).
- `src/core/adopt/inspect-repo.ts` — imports the shared patterns (no behavior change).
- New `src/commands/guard.ts`; `src/cli/main.ts` — `recall guard` wiring.
- `src/core/generator/generate-init.ts`, `README.md` — documentation.
- New `tests/unit/naming/test-files.test.ts`, `tests/integration/guard-command.test.ts`.

## Tests Run

- `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm pack:check`.
- `recall doctor` on this repository, plus a live end-to-end demo in a real git repo.

## Results

- 279 tests pass (58 files), including 8 new guard tests; adopt detection tests pass unchanged.
- Live proof: `recall guard --source src` exits 1 (lists the file) when only `src/` is staged, exits 0
  when a test is also staged. As a pre-commit gate, a src-only commit was BLOCKED (exit 1, 0 commits);
  the same change WITH a test committed cleanly.

## Skipped

- Auto-detecting source directories (kept explicit, architecture-neutral). Not wired into the default
  gates (opt-in).

## Remaining Risks

- Heuristic: it confirms a test file changed, not that the test is good or covers the change — that
  stays with the agent and the `write-tests` skill (documented).
