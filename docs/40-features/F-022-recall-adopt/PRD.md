# PRD: Recall Adopt

## Purpose

Most repositories exist before they adopt Recall OS. `recall adopt` lets an existing repository
onboard by inspecting what is already there and producing reviewable, proposed memory. This is the
biggest adoption unlock: it removes the blank-page problem for legacy repositories.

## Problem

- `recall init` creates neutral memory but knows nothing about the repository it runs in.
- A team with an existing codebase wants Recall OS to bootstrap memory from reality, without it
  silently inventing accepted decisions.

## In Scope

- Add a `recall adopt` command that performs read-only inspection of the repository.
- Detect language, package manager, frameworks, and the presence of tests and docs from manifest and
  marker files only.
- Emit an adoption report and proposed ADRs, all marked `Proposed` and requiring human review.
- Keep writes non-destructive and reuse the safe write pipeline.
- Add tests and docs.

## Non-Goals

- No accepted decisions; everything adopt produces is proposed.
- No execution of repository code, no network, no dependency installation.
- No deep static analysis; inference is limited to clear manifest and marker signals.
- No overwrite of existing repository memory by default.

## Users

- Teams onboarding an existing repository to Recall OS.
- Maintainers who want a reviewable starting point instead of a blank memory tree.

## Success Criteria

- `recall adopt` writes a `docs/adopt/ADOPTION_REPORT.md` summarizing detected signals as proposals.
- Detected frameworks produce proposed ADRs under `docs/adrs/proposed/`, all `Proposed`.
- Adopt never writes an accepted decision and never executes repository code.
- Adopt is non-destructive: existing files are skipped unless `--force`.
- A repository with no Recall config can still be adopted, using default paths.
