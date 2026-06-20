# Test Plan: Recall Adopt

Risk-based. Main risks: inferring accepted decisions, executing repo code, and overwriting files.

## Unit Tests

- `tests/unit/adopt/inspect-repo.test.ts`: detects pnpm + TypeScript; detects Next.js from deps;
  detects Python + FastAPI from `pyproject.toml`/`requirements.txt`; reports tests and README; empty
  repo yields empty signals.
- `tests/unit/adopt/generate-adoption.test.ts`: report lists detected signals; each framework yields
  a proposed ADR with `Proposed` status; no accepted decision is emitted.

## Integration Tests

- `tests/integration/adopt-command.test.ts`: `recall adopt` writes `docs/adopt/ADOPTION_REPORT.md`
  and proposed ADRs; `--dry-run` writes nothing; existing files are skipped without `--force`; adopt
  works with no `.recall/config.json`.

## Safety

- Confirm inspection never executes repository code (it only reads files).

## Regression

- `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`,
  `pnpm pack:check`, `node dist/cli.js doctor`.
