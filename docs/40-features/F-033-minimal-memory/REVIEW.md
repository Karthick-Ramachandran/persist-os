# Review: Minimal-By-Default Memory

## Scope Check

All brief items built: six-doc set, PRODUCT.md, opt-in flags, 2/3-file scaffold, preset
retirement, five not-evaluated outcomes, retired-skills check, migration line, README updates.

## Discrepancies Reported (ADR wins)

- The brief's Files table omits the ADR-mandated retired-skills check ("A new check reports
  catalog skills that have been retired but remain on disk"). Built as `retired-skills`
  (warning) per ADR-0007. Known noise: on-disk custom skills are indistinguishable from
  retired catalog skills; the message says so.
- `tests/fixtures/` does not exist on main despite brief 04's claim ("already holds
  repository fixtures"). No fixture dir created; tests build minimal repos with the existing
  temp-root + init helper pattern.
- AGENTS.md / CLAUDE.md standing rules still describe presets as a concept. Left untouched
  as a standing-rule conflict for a human to rule on (see PRD Non-Goals).
- Brief 04's memory table should be re-verified against the re-pointed code, not trusted
  (its own instruction); the 04 module will do that.

## Ambiguity Resolved

- "Chosen by flag" implemented as `--features` / `--modules` generating workflow READMEs;
  checks key off folder presence, so `feature/module create` alone also opts in.
- `detectPrePushGates` excludes the test command (single-run invariant shared with 02).
- `TEST_PLAN.md` required iff `testCommand` is set — a gate-off scaffold errors once the
  gate turns on, deliberately.
