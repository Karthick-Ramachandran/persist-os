# Review: Test Gate Module

## Scope Check

All three ADR-0009 problems addressed: proxy gate replaced, hooks split by cost, one-shot detection.
Nothing outside the brief's file table except `docs/00-product/MIGRATION.md` (new — the
migration-notes file the brief requires did not exist) and the check-outcome reporting
`DoctorReport.checks` (required by hook-drift's not-evaluated case; main has no such mechanism
because the earlier change was never merged).

## Ambiguity Resolved

The brief seeds "`prePushGates` from detection — the one-shot test command, typecheck, lint" while
also specifying "pre-push: testCommand, then prePushGates". Baking the test command into both would
run the suite twice (~10s, defeating the cost goal). Per the ADR (source of truth on conflict):
pre-push runs testCommand, typecheck, lint exactly once each, so `detectPrePushGates` returns
typecheck/lint only.

## Risks Noted

- `testCommand` split on whitespace: no quoting, no shell. Documented in the command help and
  template docs; multi-word quoted invocations must live in a package.json script.
- Existing repos' hooks predate the split template, so dogfood doctor now warns `hook-drift`.
  Intended visibility, not a regression; regeneration is a human decision.
- Merging the unmerged not-evaluated branch later will conflict in `doctor-check.ts` /
  `doctor-report.ts`; this branch is self-contained from main by design.
