# Completion Report: Aitools Output Selection

## Status

Complete.

## Files Changed

- `src/core/config/default-config.ts` — default `aiTools` is `["claude","codex","cursor"]`.
- `src/commands/init.ts` — `aiTools` option, `validateAiTools` assertion fn, path-prefix file filter.
- `src/cli/main.ts` — `--ai-tools <list>` flag (parsed, trimmed, de-duplicated).
- `src/core/generator/generate-init.ts` — `--ai-tools` documented in the generated RECALL_COMMANDS.
- `README.md` — `--ai-tools` usage note.
- `.recall/config.json` — repo's own `aiTools` aligned to the new default.
- `tests/integration/init-aitools.test.ts` (new, 5 tests); `tests/unit/config/config-schema.test.ts`.

## Tests Run

- `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm pack:check`.
- `recall doctor` on this repository.

## Results

- 267 tests pass (56 files), including 5 new `init --ai-tools` integration tests.
- typecheck, lint, format, and pack checks all pass.
- Default `init` generates the identical file set (zero regression); `--ai-tools claude` / `codex`
  narrow the output as specified; an unknown tool exits 1 with a clear message.

## Skipped

- Committed `examples/*/.recall/config.json` not refreshed (cosmetic; no test depends on it).

## Remaining Risks

- Follow-up tracked: additive "top up" of tool files on re-init without overwriting existing memory.
