# Test Plan: Minimal-By-Default Memory

- Golden: new `generated-minimal.test.ts` asserting the exact default file list (PRODUCT.md
  present; PRD/BRD/ARCHITECTURE/THREAT/ai-strategy absent; no preset outputs). The 7 preset
  goldens are deleted with the feature they goldened.
- Minimal doctor: fresh init, no folders → exit 0; each of the five checks not-evaluated
  with its reason; `required-files` clean.
- Full doctor: init + feature + module + accepted ADR → all five evaluated; old 9-file
  folders still pass (loosen-only); TEST_PLAN required iff gate on (both sides tested).
- Scaffold: 2 files gate-off, 3 files gate-on; content assertions (acceptance in PLAN,
  evidence in TASKS).
- Config: `preset` rejected with field + fix named; 0.6.x config without `preset` loads
  (defaults fill `testCommand`/`prePushGates`); dogfood root config updated.
- Retired skills: non-catalog skill dir warns with `rm -rf`; catalog-only dirs quiet;
  absent dirs quiet.
- Init flags: `--features`/`--modules` generate READMEs; default generates neither.
- Regression: full suite green; `--help` has no preset line (asserted in test).
