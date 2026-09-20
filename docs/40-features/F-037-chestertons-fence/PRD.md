# PRD: Chesterton's Fence

## Purpose

Git records what changed; Persist OS records why. Neither records why code is *shaped* the way
it is when the reasoning never rose to an ADR. The fence is a record of such reasoning that grows
through use: a change touching in-scope source with no fence record and no ADR reference produces
a warning, and the `chestertons-fence` skill walks the agent through recording the human-confirmed
reason in `FENCES.md`.

Sources of truth: [ADR-0010](../../adrs/ADR-0010-chestertons-fence.md) (Proposed — accepted at
landing) for the mechanism, [ADR-0013](../../adrs/ADR-0013-warnings-are-advisory-in-the-generated-pre-commit-hook.md)
(Accepted) for the severity premise the fence builds on; brief `~/persist-briefs/09-chestertons-fence.md`
follows both. Do-not-redesign lines from ADR-0010: never bulk-generated, human answers, no
bug-fix exemption, scope is source minus obvious non-logic, no PreToolUse hook.

## In Scope

- `docs/60-engineering/FENCES.md` format: greppable (`## \`<path>\`` sections, `Why:` one-liners),
  human-editable, shell-scannable; standing reason plus dated crossing history in one file.
- Deterministic pre-commit rule as a doctor check (`fence`): staged diff only, milliseconds, zero
  tokens. First crossing warns; later crossings surface the recorded reason as info; out-of-scope
  files and ADR-referenced files produce nothing.
- SessionStart hook injects the fence index (paths + one-line reasons, not history), truncated to
  the 24KB budget remainder with a marker pointing at the file.
- `chestertons-fence` catalog skill (fourth): three questions, one for bug fixes, under 600 words,
  trigger tests both directions.
- Fifth init question after the test gate plus `fenceEnabled` config toggle (default on); `--yes`
  and non-TTY default to on and say so.
- Zero-cost trigger: `adr create` / `adr supersede` remind about the fence when it is enabled.

## Non-Goals

- Any fence seeding, by any mechanism, ever.
- Judging whether recorded reasoning is good (gate stays dumb; agent does semantics).
- A PreToolUse hook; a config knob for hook strictness (ADR-0013); changing any other check.

## Decisions

- **Prerequisite first.** ADR-0010's warn premise was false (warnings blocked via `set -e` + doctor
  exit 1). Maintainer chose the hook fix; recorded as ADR-0013, implemented and tested before the
  fence. Doctor exit codes untouched (ADR-0011).
- **FENCES.md never required (brief option 2).** Absence means no crossing yet. `requiredDocs`
  stays flat; ADR-0010 amended. Never written by init or adopt — the skill-wielding agent writes it
  on first crossing.
- **Budget: truncate, don't complain.** The hook truncates the index to the budget remainder with a
  marker. Letting the budget check complain would duplicate hook logic in TS and fire only at
  commit time, after sessions already bloated. Doctor `context-budget` unchanged.
- **Disabled means not-evaluated**, with reason — a check that cannot run must say so (ADR-0011).
  Same for non-git repos and missing config (via `CONFIG_GATED_CHECKS`).
- **ADR reference means the path string appears in an ADR file** (accepted or proposed): the
  reasoning is being recorded somewhere, so the fence stays quiet.
