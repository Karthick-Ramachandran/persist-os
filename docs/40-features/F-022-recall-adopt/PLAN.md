# Plan: Recall Adopt

## Approach

Add an `adopt` concern with read-only inspection and proposed-memory generation, then a thin command
that reuses the safe write pipeline. No accepted memory is ever produced (ADR-0003).

## Steps

1. `src/core/adopt/inspect-repo.ts`: read manifest and marker files; return `RepoSignals`
   (languages, package manager, frameworks, hasTests, hasReadme, hasDocs).
2. `src/core/adopt/generate-adoption.ts`: render `docs/adopt/ADOPTION_REPORT.md` and a proposed ADR
   per detected framework, all `Proposed`.
3. `src/commands/adopt.ts`: load config if present (else defaults), inspect, build the write plan
   non-destructively, execute, and format the result.
4. Register `recall adopt` in the CLI with `--dry-run` and `--force`.
5. Add unit and integration tests; update module memory and docs.

## Reuse

- `loadConfig` / `createDefaultConfig` for paths.
- `createWritePlan` / `executeWritePlan` for safe, non-destructive writes.
- The proposed-ADR format used by presets.

## Out Of Scope

- Executing repository code or build tooling.
- Deep static analysis and ownership inference.
