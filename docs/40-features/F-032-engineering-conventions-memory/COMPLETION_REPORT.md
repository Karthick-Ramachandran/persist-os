# Completion Report: Engineering Conventions Memory

## Status

Complete.

## Files Changed

- `src/core/generator/generate-init.ts` — scaffold `CONVENTIONS.md` and `LESSONS.md`; add both to
  `AGENTS.md` required reading.
- `src/core/doctor/checks/conventions-check.ts` (new) — deterministic stub nudge for
  `CONVENTIONS.md`, gated on the repository having real work.
- `src/core/doctor/doctor-check.ts` — wire `checkConventions` into `runDoctor`.
- `src/core/skills/skill-catalog.ts` — add the portable, script-free `conventions-adherence` skill.
- `tests/unit/doctor/conventions-check.test.ts` (new) — bare/stub-with-work/filled/absent cases.
- `tests/unit/skills/skill-catalog.test.ts`, `tests/golden/generated-generic.test.ts` — updated for
  the new skill and the two new docs.
- `README.md` — Conventions row in the Doctor checks table.

## Tests Run

- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check`
- `pnpm test:run`
- `pnpm build`
- `persist doctor`
- Manual CLI end-to-end: stubbed-with-work emits `content-conventions`; filled clears it; bare init
  stays green; `skill list` / `skill create conventions-adherence` produce a valid script-free
  SKILL.md.

## Results

- 290/290 tests pass (4 new conventions-check cases; updated catalog + golden tests).
- typecheck, lint, format, build all pass.
- `persist doctor` PASSED on the repository.
- End-to-end behavior matches all acceptance criteria.

## Remaining Risks

- `examples/generated-*` are not regenerated here; they are stale independently of this change
  (missing the `.claude/.agents` skill dirs since 0.4.0) and should be refreshed in a dedicated
  cleanup with `persist init --preset <id> --force --reinit`. Examples are illustrative and not
  test-verified, so this does not affect correctness.
