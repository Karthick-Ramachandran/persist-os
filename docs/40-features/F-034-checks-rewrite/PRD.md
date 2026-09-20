# PRD: Checks Rewrite

## Purpose

Module 03 made features, modules, and most documents optional, and the five doctor checks that read
those documents survived by reporting not evaluated. Honest, but a minimal repository — six
documents, some ADRs, no features, no modules — gets a gate that checks almost nothing. This module
re-points the five checks at the memory that survives, so a minimal repository gets a real gate
while a full repository loses nothing.

Source of truth: [ADR-0007](../../adrs/ADR-0007-minimal-by-default-repository-memory.md) (Accepted)
and the handed-over brief `~/persist-briefs/04-checks-rewrite.md`. Where the brief and the ADR
disagree, the ADR wins; discrepancies are recorded here, not silently resolved.

## In Scope

- `memory-integrity` also validates cross-references between the six required documents and
  references from those documents to ADRs, so it evaluates on repos with no features, modules, or
  ADRs as long as required docs exist.
- `standards` also flags accepted ADRs with placeholder alternatives and security-sensitive
  decisions without security notes, so ADRs alone give it real work.
- `content` also flags unfilled `PRODUCT.md` templates once the repo has work. `CONVENTIONS.md`
  stays owned by the existing conventions check (one gap, one warning).
- `code-reference` also scans ADRs and `CONVENTIONS.md`, so it evaluates without features or
  modules.
- `staleness` compares the same widened doc set against code history, keeping the shallow-clone and
  non-git handling exactly as it is.
- `code-reference` and `staleness` treat a feature folder containing `COMPLETION_REPORT.md` as
  history and skip its planning docs. This clears this repo's six preset/guard warnings without
  editing any historical document.

## Non-Goals

- New checks, new questions, severity changes, exit-code changes.
- The Chesterton fence and `FENCES.md`: a later module; nothing here anticipates it.
- Skills, interactive init, upgrade.
- Editing historical feature docs or accepted ADRs to satisfy the rewritten checks.
- A committed `tests/fixtures/` directory: it does not exist, so the module follows the established
  temp-root helper pattern instead (recorded discrepancy).

## Decisions

- ADR wins over the brief table: the ADR's surviving set includes `FENCES.md`, which no generator
  emits and for which no path convention exists, so there is nothing to scan. Recorded as an
  accepted gap for the fence module, not wired here.
- The brief's "reads today" column overstates module-03 behavior (verified against sources:
  memory-integrity reads feature PLAN/TASKS/TEST_PLAN, module MODULE/TASKS/TEST_PLAN/DECISIONS, and
  ADR sections — not the nine listed documents). The re-pointing is specified against actual
  behavior.
- `standards-adr-security-notes` is always a warning. This repository's accepted ADR-0005 makes a
  security-sensitive decision with no Security section; erroring would break the own-repo build and
  force editing accepted history.
- `standards-adr-alternatives` mirrors the consequences severity (accepted errors, proposed warns):
  all accepted ADRs here have substantive alternatives, verified before wiring.
