# Tasks: Init Reinit Guard

## T1: Implement guard and flag

- Status: Complete.
- Scope: `initProject` guard and CLI `--reinit` flag.
- Acceptance: Refuses `--force` on an existing installation unless `--reinit`.
- Tests: Init integration tests.

## T2: Document and verify

- Status: Complete.
- Scope: Command reference, generator template, contribution guide; regenerate examples.
- Acceptance: Docs describe `--reinit`; gates pass.
- Tests: Full suite, typecheck, lint, format, build, pack, and `recall doctor`.
