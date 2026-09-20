# Doctor Decisions

## P9: Doctor Is Read-Only

P9 Doctor validates repository memory health and reports findings.

It does not fix or mutate files.

## P9: Exit Code Severity

Doctor uses:

```txt
0 = healthy
1 = warnings only
2 = errors
```

This makes Doctor useful as an AI completion gate.

## P9: Structural Checks First

P9 validates deterministic memory structure and required sections.

Semantic drift detection remains future work.

## P10: Persist Paths

Doctor treats `.persist/config.json` and `docs/ai/PERSIST_COMMANDS.md` as required repository
memory.

## P12: Standards Evidence Checks

Doctor now checks deterministic engineering evidence in repository memory.

Completed features require review, test evidence, and result evidence. ADRs require consequence
substance. Security-sensitive feature planning requires security impact notes.

These checks are read-only and deterministic. Semantic drift detection remains future work.

## P13: Deterministic Drift Checks

Doctor now performs the first deterministic drift checks against accepted repository memory.

Feature and module memory that references an `ADR-####` identifier with no matching ADR file is an
error. Memory that references an existing ADR whose status is not accepted is a warning. References
to existing accepted ADRs produce no finding.

These checks remain read-only, local, and deterministic. They reuse the existing `DoctorFinding`
model and exit-code mapping. Semantic contradiction detection, module-ownership comparison, and
code-to-doc drift remain future work.

## Hook Drift (ADR-0009)

Doctor regenerates both git hooks from the validated config in memory and diffs them against the
tracked files. A mismatch is a warning with the regeneration command — a hand-edited hook is
legitimate but must be visible, since regenerating from drifted config would silently drop the edit.
Absent hooks report the check as not-evaluated rather than passing.

## Check Outcomes

Every doctor run records a per-check outcome (`evaluated` / `not-evaluated` with a reason) for all
checks, rendered as a NOT EVALUATED text section and a JSON `checks` array. Not-evaluated is a
property of a check, not a fourth severity; it never moves the exit code. Added because the
config-gated checks were silently dropped without a config, reading as a full pass.

## Minimal-By-Default Inputs (ADR-0007)

The five checks that read optional memory (memory-integrity, standards, content, code-references,
staleness) report not-evaluated with a specific reason when their inputs are absent — no
feature/module folders, no ADRs — instead of matching nothing and passing. Verdict logic is
otherwise untouched; the rewrite against the surviving memory is a later module.

## Re-pointed Checks (F-034)

The five checks now read the memory that survives (required documents, ADRs, conventions) in
addition to feature and module documents, so minimal repositories get a real gate:

- memory-integrity validates cross-references between the six required documents and their ADR
  references (missing targets error, proposed references warn);
- standards requires substantive Alternatives Considered (accepted errors, proposed warns) and warns
  on security-sensitive decisions without security notes — always a warning, so the heuristic never
  breaks a build or forces edits to accepted history;
- content flags unfilled PRODUCT templates once the repository has work (CONVENTIONS stays owned by
  the conventions check: one gap, one warning);
- code-reference and staleness scan ADRs and conventions, and skip planning docs of features
  carrying a completion report (history, not current state).

Not-evaluated is now reserved for genuine inability: missing config, no scannable memory at all, or
(staleness) non-git and shallow-clone repositories.
