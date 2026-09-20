# Completion Report: Checks Rewrite

## Status

Complete.

## What shipped

The five checks answer their same questions against the surviving memory. Full-repo behavior is
preserved; minimal repos now get evaluated instead of abstained.

- memory-integrity: required-doc cross-reference pass added (missing doc target errors, unknown ADR
  errors, proposed ADR warns); evaluates whenever required docs exist.
- standards: alternatives-substance rule (mirrors consequences severity) and security-notes rule
  (always warning) added; feature and consequence checks untouched.
- content: PRODUCT Purpose/Users template detection added, gated on repository work like the
  security-doc checks; CONVENTIONS deliberately left to the conventions check.
- code-reference: scans ADRs and CONVENTIONS.md; skips planning docs of features containing
  COMPLETION_REPORT.md.
- staleness: same widened doc set and history exclusion; git, shallow-clone, and non-git handling
  byte-identical.
- required-files-check exports its doc list for reuse; doctor wiring unchanged.

## Tests Run

- pnpm test:run: 61 files, 360/360 pass (19 new: 4 memory-integrity, 5 standards, 2 content, 4
  code-reference, 4 staleness; 3 existing assertions updated to the new honest behavior).
- pnpm typecheck, pnpm lint, pnpm format:check, pnpm build: clean.
- node dist/cli.js doctor on this repo: zero errors, exit 1 on warnings. The six preset/guard
  code-reference warnings and the staleness warnings are gone with no historical document edited.
  Three new security-notes warnings (the MCP-context, skill-architecture, and generated-skills ADRs)
  are accepted: the heuristic is warning-only by design, and fixing them would mean editing accepted
  history.

## Results

- Suite green: 61 files, 360/360 tests pass, including 19 new regression tests.
- Typecheck, lint, format check, and build are clean.
- Own-repo doctor reports zero errors; the six preset/guard warnings are gone with no historical
  document edited.

## Narrowness

One deliberate narrowing, brief-mandated: planning docs of completed features are history for
code-reference and staleness. Everything else widens. No severity, outcome id, or exit-code behavior
changed for any existing scenario.

## Discrepancies reported (ADR won)

- Brief table's "reads today" column overstated module-03 behavior; verified against sources before
  specifying.
- ADR's surviving set includes FENCES.md, which no generator emits and for which no path exists:
  accepted gap for the fence module, not wired here.
- tests/fixtures/ does not exist: followed the temp-root helper pattern.
- Bare-init doctor JSON now reports 4 info findings (was 1): the three memory-integrity count infos
  evaluate instead of abstaining.

## Remaining risks

- The security-notes heuristic keys off fixed vocabulary; ADRs using security-sensitive terms
  informatively will warn until they gain a Security section. Warning-only, so the cost is noise,
  not breakage.
- Completion-report presence is a coarse history marker: a folder with a report but live planning
  docs is treated as history. Matches the brief; revisit only with evidence of misuse.
