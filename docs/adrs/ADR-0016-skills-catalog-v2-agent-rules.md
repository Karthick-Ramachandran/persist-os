# ADR-0016: Skills Catalog v2 and Stronger Agent Rules

## Status

Proposed

## Context

In 0.6.x, agents followed ADRs and project rules reliably in practice. In 1.x they
sometimes don't. Comparing the generated files shows that `AGENTS.md` barely changed:
"Never contradict an accepted ADR" is word for word the same. What 1.0 removed were
three things:

1. **Stop conditions.** Every 0.6 skill ended with "Stop and request human decision
   if…": the task conflicts with an accepted ADR or engineering standards, a dependency
   is added without an ADR, tests can't be designed from the requirements. Nothing
   always-loaded says this today.
2. **Workflow steps that acted on the rules.** `implement-task` listed the governing
   ADRs and module docs as inputs, so the agent read them before coding.
   `architecture-drift-review` compared the diff against accepted ADRs, module
   boundaries, and new dependencies from a fresh context.
3. **Nine skills**, retired in the move from twelve to three (now six).

Two doctor bugs also weaken the current rules: with nothing staged, the change is only
the unpushed commits, so doctor never names the governing ADR for uncommitted edits at
the moment the task loop runs it; and the decision quote takes the first sentence,
which once cut "Every amount … and intermediate math. Never floats." to
"… intermediate math."

## Decision

The catalog grows from six skills to twelve, and every restored skill is rewritten
rather than revived verbatim.

**Restored, rewritten:** `implement-task` (the default for any code change; the
five-step loop in detail), `write-tests` (tests from acceptance criteria and risk; a
bug fix gets a test that fails without it, run red first), `create-adr` (falsifiable
rules, an allowed and a forbidden example, a filled Applies To list, Proposed until a
human accepts), `drift-review` (absorbs `architecture-drift-review`; calls into
`adr-compliance` for the ADR part), `completion-report` (files, commands with results,
skips, risks). **Restored, merged:** `module-memory` (merges `plan-module` and
`update-module-memory`; generated only when module memory is enabled).

**Kept:** `plan-feature` (absorbs `create-prd`: write a one-page PRD first when no
requirements exist), `adr-compliance`, `conventions-adherence`, `security-review`,
`chestertons-fence`, `context` — unchanged apart from linking the shared Stop and ask
list where the brief requires it.

Every skill keeps the ADR-0008 shape (WHAT and WHEN plus trigger language in the
description, 5–9 workflow steps, Decisions, Verification, one-hop Resources) and gains
a Skip for clause naming its neighbours, so routing never overlaps. Every skill that
can make or approve a change ends with the same Stop and ask list — defined once in
`AGENTS.md`, linked, never copied.

`AGENTS.md` and the Cursor rule keep everything they have and add, near the top: the
Stop and ask block, the source-of-truth order (accepted ADRs first, chat history
last; conflicting sources stop the work), and one line per skill so `implement-task`
is known as the default.

Doctor fixes: with nothing staged, the change is the unpushed commits plus the
uncommitted working tree (tracked modifications and untracked files, respecting
`.gitignore`); with no upstream it is the working-tree changes alone, and
not-evaluated only when there is none. The staged-only view is unchanged, so the
pre-commit hook still judges only the commit being made. Decision quotes take the
whole first bullet or paragraph, capped near 300 characters at a word boundary. Each
accepted ADR with no Applies To list gets an info nudge to declare its paths.

**Part C.3 verdict: excluded.** The A/B runs below put six true no-card scene-3 runs
(0.6.1 and 1.2.4, which predate context cards) against the integer-cents decision: all
six found the ADR from the SessionStart title list (2–8 file references each) and
followed it — every trap case came back whole cents. Cards plus the title list suffice;
the decision lines would spend always-loaded bytes for no measured gain.

## Applies To

- `src/core/skills/skill-catalog.ts`
- `src/core/generator/generate-init.ts`
- `src/commands/init.ts`
- `src/core/doctor/change-set.ts`
- `src/core/doctor/checks/fence-check.ts`
- `src/core/doctor/checks/governing-adrs-check.ts`
- `src/core/doctor/checks/retired-skills-check.ts`
- `src/core/adr/governing-adrs.ts`
- `src/core/hooks/generate-hook.ts`

## Alternatives Considered

- **Keep the six-skill catalog and only fix doctor.** Rejected: it leaves the
  stop-condition and acting-step gaps that the A/B runs measure.
- **Restore the 0.6 skills verbatim.** Rejected: they predate progressive disclosure
  (`Required Reading` expands one trigger into ~15,000 tokens) and duplicate commands
  the CLI now owns (`persist adr create`, `persist fence add`).
- **Copy the Stop and ask list into every skill.** Rejected: six copies drift; one
  definition in `AGENTS.md` with links stays identical everywhere.
- **Add the SessionStart ADR lines unconditionally.** Decided by the A/B results
  (see above), not by default: always-loaded bytes are the scarcest budget.

## Consequences

**Improves.** The stop conditions and acting steps that made 0.6 reliable are back,
in the leaner format: skill router 1,889 → 3,599 bytes, always-loaded files
7,060 → 10,116 bytes of the 24 KB budget. Doctor judges the change the task loop
actually has (uncommitted edits included) and quotes decisions whole.

**Worsens.** Twelve skills to maintain instead of six; each restored description is a
new routing surface that the trigger tests must hold.

**Risks.** A/B summary: 12 runs (4 versions × 3) of demo scenes 2–3, headless, fresh
sessions, memory reset between runs. ADR written and accepted 12/12 with no follow-up;
Applies To yes in all nine 1.x runs (the 0.6.1 ADR shape has no such section); suites
green 12/12; the $47.30 + 15% trap case executed whole cents in 12/12 — no run put
fractional-cent math on money, though eleven diffs divide money (all behaviorally exact
integer math, verified by execution, not inspection). Agents ran doctor in 10/12 runs.
Part C.3 excluded per the verdict above.

## Related Documents

- Product: `docs/00-product/PRODUCT.md`
- Architecture: `docs/ai/AI_AGENTS_SKILLS_MCP_STRATEGY.md`
- Security: `docs/20-security/SECURITY_MODEL.md`
- Feature: `docs/50-quality/QUALITY_GATES.md`
- Related: [ADR-0008](ADR-0008-skill-architecture-progressive-disclosure.md),
  [ADR-0010](ADR-0010-chestertons-fence.md), [ADR-0011](ADR-0011-one-zero-stability-contract.md),
  [ADR-0015](ADR-0015-context-cards-and-prompt-lookup.md)

Supersedes the parts of ADR-0008 that set the smaller catalog (three skills, then
six) and the nine-name retired list.
