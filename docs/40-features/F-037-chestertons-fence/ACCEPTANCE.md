# Acceptance: Chesterton's Fence

1. `persist init` with the fence enabled writes `fenceEnabled: true`; disabled writes `false` and
   generates nothing fence-related (no `FENCES.md` from init or adopt, ever).
2. In-scope staged change with no fence and no ADR reference produces a `fence` warning.
3. Out-of-scope change (test, style, lockfile) produces nothing; ADR-referenced file produces
   nothing.
4. Second change to a fenced path surfaces the recorded reason (info, exit code unaffected).
5. Fence disabled: no prompt, no findings, check reports not-evaluated with reason.
6. No git repo / git unusable: check reports not-evaluated with reason, never a pass.
7. SessionStart output injects the index once; a large `FENCES.md` stays within the 24KB budget
   with a marker naming the file.
8. `persist skill list` shows four skills; trigger tests pass both directions.
9. No new dependencies; this repo's `persist doctor` reports zero errors.
10. `PRODUCT.md` proposed-ADR warning clears once ADR-0010 is accepted.
