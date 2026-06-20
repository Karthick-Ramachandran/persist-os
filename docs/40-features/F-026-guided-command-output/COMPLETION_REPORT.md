# Completion Report: Guided Command Output

## Status

Complete.

## Tasks Completed

- T1: Added the shared `appendNextSteps` helper.
- T2: Wired guided next-steps output into init, adopt, feature, adr, module, skill, and mcp.
- T3: Ran the gates and recorded completion.

## Files Changed

- `src/commands/write-summary.ts`
- `src/commands/init.ts`, `src/commands/adopt.ts`
- `src/commands/feature/create.ts`, `src/commands/adr/create.ts`, `src/commands/module/create.ts`
- `src/commands/skill/create.ts`, `src/commands/mcp/add.ts`
- `tests/integration/guided-output.test.ts` (new)
- `docs/40-features/F-026-guided-command-output/` (new feature memory)

## Tests Run

- `pnpm test:run`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check`
- `pnpm build`
- `pnpm pack:check`
- `node dist/cli.js doctor`

## Results

- Full test suite passed: 49 files, 231 tests (4 new for guided output).
- `pnpm typecheck`, `pnpm lint`, and `pnpm format:check` passed.
- `pnpm build` passed; `pnpm pack:check` validated 169 files.
- `node dist/cli.js doctor` passed after this report was written.
- Manual verification: `init`, `adr create`, and `feature create` each print a "Next steps" block
  naming the file and the action; a dry run prints none.

## Remaining Risks

- Guidance text is static; it does not adapt to repository-specific state beyond the created paths.
- Interactive prompts are intentionally not implemented.

## Docs Updated

- F-026 feature memory.

## Engineering Standards

Engineering standards were followed. The change is presentation-only, scoped, and tested, and adds no
new files, capabilities, dependencies, network, or telemetry.
