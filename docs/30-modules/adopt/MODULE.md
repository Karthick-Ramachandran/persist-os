# Module: Adopt

## Purpose

Adopt owns onboarding an existing repository into Recall OS by inspecting it and producing reviewable,
proposed memory.

## Owns

- Read-only repository inspection (`RepoSignals`).
- Generation of the adoption report and proposed framework ADRs.
- The `recall adopt` command orchestration.

## Does Not Own

- Accepted decisions (adopt only proposes).
- Config schema or the write pipeline (reused from `config` and `filesystem`).
- Executing repository code, network access, or dependency installation.

## Public Interfaces

- `inspectRepo`
- `RepoSignals`
- `generateAdoptionFiles`
- `adoptProject`
- `formatAdoptResult`

## Boundaries

Adopt reads manifest and marker files only and writes through the safe, non-destructive pipeline. It
never executes repository code and never produces accepted memory.

## Current Decision

Governed by ADR-0003. Adopt inspects read-only, infers conservatively, and emits an adoption report
plus proposed ADRs, all `Proposed` and requiring human acceptance. Works with or without an existing
Recall config, using default paths when none is present.
