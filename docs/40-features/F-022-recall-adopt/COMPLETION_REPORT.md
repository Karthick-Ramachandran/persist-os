# Completion Report: Recall Adopt

## Status

Complete.

## Tasks Completed

- T1: Planned the feature and accepted ADR-0003 (propose, never accept).
- T2: Implemented read-only repository inspection.
- T3: Implemented adoption report and proposed-ADR generation.
- T4: Added the `recall adopt` command and CLI wiring.
- T5: Added module memory, docs, tests, and completion evidence.

## Files Changed

- `src/core/adopt/inspect-repo.ts` (new), `src/core/adopt/generate-adoption.ts` (new)
- `src/commands/adopt.ts` (new)
- `src/cli/main.ts`
- `src/core/generator/generate-init.ts`
- `tests/unit/adopt/inspect-repo.test.ts` (new),
  `tests/unit/adopt/generate-adoption.test.ts` (new)
- `tests/integration/adopt-command.test.ts` (new)
- `docs/adrs/ADR-0003-recall-adopt-proposes-not-accepts.md` (new)
- `docs/30-modules/adopt/` (new module memory)
- `docs/40-features/F-022-recall-adopt/` (new feature memory)
- `docs/ai/RECALL_COMMANDS.md`, `README.md`
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

- Full test suite passed: 43 files, 209 tests (9 new for adopt).
- `pnpm typecheck`, `pnpm lint`, and `pnpm format:check` passed.
- `pnpm build` passed; `pnpm pack:check` validated 169 files.
- `node dist/cli.js doctor` passed after this report was written.
- Manual verification: `recall adopt` on a Next.js-style repo detected TypeScript, pnpm, and Next.js
  and wrote an adoption report plus a proposed (not accepted) ADR.

## Remaining Risks

- Inference covers a fixed set of ecosystems and frameworks; unknown stacks yield fewer signals.
- Module-boundary and ownership inference is not yet implemented; it is deferred to later work.

## Docs Updated

- ADR-0003, F-022 feature memory, adopt module memory, command reference, and README.

## Engineering Standards

Engineering standards were followed. The change is scoped, tested, documented, and governed by an
accepted ADR. Adopt is read-only during inspection, non-destructive when writing, proposes rather
than accepts, and adds no network, telemetry, dependency, or capability beyond reading marker files.
