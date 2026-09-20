# PRD: Skills v2

## Purpose

The catalog ships 12 skills whose structure is close to right, but every skill
carries `## Required Reading`: a level-three resource list written as a level-one
mandate. `ENGINEERING_STANDARDS.md` appears in 9 of 12 skills; `plan-feature`
demands eight documents before step one, turning a ~400-token skill into ~15,000
on trigger. This module cuts the catalog to 3 skills rewritten from scratch
against the progressive-disclosure shape, with resources as one-hop links, earned
sections, and explicit verification and output.

Sources of truth: [ADR-0008](../../adrs/ADR-0008-skill-architecture-progressive-disclosure.md)
and [ADR-0012](../../adrs/ADR-0012-generated-skills-may-ship-scripts.md) (both to
be Accepted before scripts are written), and the handed-over brief
`~/persist-briefs/05-skills-v2.md`. Where the brief and the ADRs disagree, the
ADRs win.

## In Scope

- Retire nine skills; rewrite `plan-feature`, `security-review`,
  `conventions-adherence` from scratch (150–600 words, WHAT+WHEN descriptions,
  no `## Required Reading`, `## Verification` and `## Output` on each).
- `render-skill.ts` emits earned sections only; catalog type gains scripts.
- One script where it genuinely replaces prose: a read-only staged-diff secret
  scan for `security-review`, under ADR-0012's four constraints with tests.
- `persist init` names executable files it wrote.
- Accept ADR-0008 and ADR-0012 via the CLI; supersede the scriptless-skills ADR via the CLI;
  remove the scriptless MVP line from `CLAUDE.md` and `AGENTS.md`.
- Executable-generated-output sections in the security model and threat model.
- Retired-skills verification both ways (check already exists; no logic change).
- This repo's own generated skills regenerated from the new catalog.
- Trigger tests per surviving skill (must-activate and must-not prompts).

## Non-Goals

- Interactive init (module 06); fence; upgrade; doctor changes beyond the
  retired-skills id list (none needed — the check derives from the catalog).
- Redesigning `mcp add`: it still installs its skill file, now a skeleton to
  fill in; one doc sentence updated to say so.
- Solving the retired-vs-custom skill ambiguity (recorded limitation).

## Decisions

- ADR-0012 acceptance is verified before any script content is written; the
  reversal is legitimate only through the ADR.
- Retiring nine skills is the expected breaking change; a second one stops the
  module.
- A description that routes worse is a silent failure: trigger-term tests guard
  each description, including cross-skill exclusion terms.
