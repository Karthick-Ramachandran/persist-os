# PRD: Minimal-By-Default Memory

## Purpose

`persist init` generates more memory than most repositories will maintain, and doctor refuses
to pass until all of it exists: 14 required documents (~60KB, two thirds of it PRD + BRD),
9 files per feature, 10 preset packs. Ceremony that exceeds its value does not get maintained —
it rots, and rotted memory is worse than no memory.

This module cuts the default to the set that earns its place and makes everything else opt-in.

Source of truth: [ADR-0007](../../adrs/ADR-0007-minimal-by-default-repository-memory.md)
(Accepted). Where this PRD and the ADR disagree, the ADR wins.

## In Scope

- Required set: `docs/adrs/` (+ index), `00-product/PRODUCT.md`,
  `60-engineering/{ENGINEERING_STANDARDS,CONVENTIONS,LESSONS}.md`,
  `20-security/SECURITY_MODEL.md`, `50-quality/QUALITY_GATES.md`. Six documents + ADR dir.
- New `PRODUCT.md` template (user fills it; not a copy of this repo's product docs). This
  repo's own `docs/00-product/` is untouched — generated output and own memory are different
  products.
- Opt-in by flag for now: `persist init --features` / `--modules` generate the workflow
  READMEs; without them nothing feature/module-shaped is generated. Checks key off folder
  presence, so `feature create` / `module create` alone also opt a repo in. Interactive init
  (ADR-0007's four questions) is explicitly deferred, not rejected.
- Feature scaffold: `PLAN.md` + `TASKS.md` (acceptance folds into PLAN, completion evidence
  into TASKS), plus `TEST_PLAN.md` only when `testCommand` is set. Memory-integrity requires
  PLAN+TASKS always, TEST_PLAN only with the gate on.
- Presets retired: `src/presets/`, `src/core/presets/`, `persist preset list`, `--preset`,
  the `preset` config field. A config containing `preset` fails with an error naming the
  field and the one-line fix (delete the line). MIGRATION.md gains the line.
- Five checks report not-evaluated (never silent pass) when their inputs are absent, using
  the PR #16 outcome mechanism. No verdict changes otherwise.
- ADR-mandated addition beyond the brief's file table: a `retired-skills` warning naming
  on-disk skills outside the built-in catalog and the `rm -rf` to remove them. Known noise:
  it cannot distinguish a retired catalog skill from a hand-made custom skill; the message
  says so.

## Non-Goals

- Rewriting the five checks against the new memory (module 04).
- Interactive init; skills; fence; restructuring this repo's own docs.
- Updating historical feature memory (F-007, F-018, F-030) or the presets module memory
  beyond a retirement line — they are records of shipped work.
- Touching `AGENTS.md` / `CLAUDE.md` standing rules: the preset-concept lines there are now
  stale, which is reported, not silently resolved (standing-rule conflict).

## Decisions

- Empty `featuresDir`/`modulesDir` are not generated and not required: `configured-directories`
  keeps `docsDir` + `adrDir` only. Absence is never an error.
- Old 9-file feature folders keep passing (requirements only loosen): they contain PLAN +
  TASKS already.
- `TEST_PLAN.md` required iff `testCommand` is set — a feature scaffolded while the gate was
  off errors once the gate turns on. Deliberate: the third file exists only when enforced.
