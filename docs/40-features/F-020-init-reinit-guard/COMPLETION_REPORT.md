# Completion Report: Init Reinit Guard

## Status

Complete.

## Tasks Completed

- T1: Added the `initProject` guard and the CLI `--reinit` flag.
- T2: Documented `--reinit`, regenerated examples, and recorded evidence.

## Files Changed

- `src/commands/init.ts`
- `src/cli/main.ts`
- `src/core/generator/generate-init.ts`
- `docs/ai/RECALL_COMMANDS.md`
- `CONTRIBUTING.md`
- `tests/integration/init-command.test.ts`
- `docs/40-features/F-020-init-reinit-guard/` (new feature memory)
- `examples/generated-*/` (regenerated with the updated command reference)

## Tests Run

- `pnpm test:run`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check`
- `pnpm build`
- `pnpm pack:check`
- `node dist/cli.js doctor`

## Results

- Full test suite passed: 39 files, 197 tests (2 new guard tests).
- `pnpm typecheck`, `pnpm lint`, and `pnpm format:check` passed.
- `pnpm build` passed; `pnpm pack:check` validated 169 files.
- `node dist/cli.js doctor` passed after this report was written.
- Manual verification: `init --force` in a directory with `.recall/config.json` refused and
  preserved an edited `AGENTS.md`; `init --force --reinit` regenerated it.

## Remaining Risks

- The guard keys on `.recall/config.json`. A corrupted or partial installation without that file
  would not trigger the guard, though `--force` there is the intended fresh-overwrite case.

## Docs Updated

- Command reference, generator template, contribution guide, and F-020 feature memory.

## Engineering Standards

Engineering standards were followed. The change is scoped, tested, documented, and strengthens the
non-destructive write policy. No new dependency, network, telemetry, or capability was added.
