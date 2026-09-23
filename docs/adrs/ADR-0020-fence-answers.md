# ADR-0020: A Fence That Can Be Answered

## Status

Accepted

## Context

The fence ([ADR-0010](ADR-0010-chestertons-fence.md)) exists for one case: a write that calls four
collections on purpose, which an agent "simplifies" to one. It asks a human why existing code is
shaped the way it is before that code is rewritten. That purpose is right and stays.

What is broken is the loop around it. No repository using Persist OS has ever produced a
`FENCES.md`: not Persist OS itself, not the demo apps, not a production app with weeks of work.
Measured on the last 60 Persist OS commits, with the fence's real scope rules, 35 commits would warn
— nearly every warning fair to ask — and none was ever answered. The same files kept warning:
`src/core/version.ts` 14 times, `src/commands/context/find.ts` and `src/core/context/search.ts` 6
each.

Three causes, all in how the fence is answered rather than when it fires:

1. **Only one answer is recorded.** The `chestertons-fence` skill allows three outcomes, but only a
   deliberate constraint is recorded. For ordinary code the honest answer is "nothing deliberate
   here", and it leaves no trace — so the same file warns on the next commit and every commit after.
   The only way to quiet a file is to claim a constraint that does not exist, which the rules
   rightly forbid.
2. **The question can't be answered as asked.** The warning names a whole file and says "ask why the
   existing logic is shaped this way". A human can't answer that about `types.ts`. The warning never
   says which code the diff rewrote.
3. **Nobody asks.** In a real session the agent explained the fence and moved on without putting a
   question to the human; unattended, it can't ask at all. Meanwhile the rules say work is done only
   when doctor reports PASSED, which a human-only warning makes impossible — so agents report
   "WARNINGS, these are fine" and everyone learns to ignore warnings.

## Decision

A fence has two recorded answers, and the question names the rewritten lines:

- **The warning names the old-side ranges** of hunks that remove or change lines, read with
  `git diff -U0` once per change set from the same change set the check already judges, with git's
  hunk context text (trimmed, clipped to 60 characters; omitted when empty). A file whose diff only
  adds lines still warns, naming its insertion points (`adds lines at 12, 40`); a binary file says
  `binary change`; at most 3 ranges, then `and N more`. A rename is judged as its new path with
  ranges from the rename pair's diff. JSON carries the same finding plus an additive optional
  `ranges` array of `{ start, end, context }`.
- **`persist fence add <path> --no-constraint --by <name>` records the second answer**: a named
  human confirmed nothing in the file is deliberate. `--by` is required; `--why`/`--adr` with
  `--no-constraint` are usage errors. A no-constraint entry quiets the file; a `Why:` entry still
  reports the reason as info. A later `--why` replaces the standing line and keeps the history;
  `--no-constraint` over a `Why:` is refused and writes nothing. No-constraint entries are not
  injected into sessions (they answer nothing an agent needs before editing) and count the same as
  any entry in the rot checks.
- **The agent asks, or hands back something answerable.** Human present: one question per file
  quoting the ranges, recorded with the matching command, never picked by the agent. Unattended:
  each warning goes in the "Needs your review" list with the question and both ready-to-run
  commands. A reason given in conversation is recorded with `persist fence add` right then. Done
  means doctor reports no errors, the tests pass, and every warning is fixed or listed under Needs
  your review — `PASSED` is the goal, not a condition an agent can meet without a human.
- **Severities and scope are unchanged.** A no-record crossing stays a warning, a recorded fence
  stays info, the pre-commit hook still never blocks on either, added files stay quiet, and the
  Accepted/Proposed ADR rules are untouched. No new dependency, config key, check id, or error; the
  CLI change is one additive option.

## Applies To

- `src/core/doctor/checks/fence-check.ts`
- `src/core/doctor/diff-ranges.ts`
- `src/core/doctor/change-set.ts`
- `src/core/fence/generate-fence.ts`
- `src/core/fence/fence-entries.ts`
- `src/commands/fence/add.ts`
- `src/core/hooks/generate-hook.ts`
- `src/core/generator/generate-init.ts`
- `src/core/skills/skill-catalog.ts`

## Alternatives Considered

- **Quieten the fence instead (scope cuts, bug-fix exemptions).** Rejected: every change that warns
  today still warns until a human answers for that file. The purpose guard — the four-collections
  collapse and the early return above it — warns before and after.
- **Record "nothing deliberate" without a name.** Rejected: the record is only worth something
  because a named person gave it. An agent picking the answer itself is guessing, which ADR-0010
  rules out.
- **A second file for cleared files.** Rejected (ADR-0010): `FENCES.md` stays the single fence file.
  No second file and no new config.
- **Keep "done only when doctor reports PASSED".** Rejected: a human-only warning makes that
  impossible without a human, so agents learn to report warnings as fine and everyone learns to
  ignore them.

## Consequences

**Improves.** Every warning becomes a question someone can answer, and an honest "nothing
deliberate" is recorded — so `FENCES.md` finally grows through use instead of staying empty while
the same files warn forever.

**Worsens.** Warnings get longer (ranges plus two commands per file). The fence index pipeline and
every FENCES.md reader must agree on two standings instead of one.

**Risks.** A human can wave `--no-constraint` through without reading, quieting a file with no more
thought than ignoring the warning took. Mitigated the same way as `Why:` guesses: the record names
who confirmed it.

## Related Documents

- Related: [ADR-0010](ADR-0010-chestertons-fence.md),
  [ADR-0011](ADR-0011-one-zero-stability-contract.md),
  [ADR-0013](ADR-0013-warnings-are-advisory-in-the-generated-pre-commit-hook.md),
  [ADR-0017](ADR-0017-any-stack-test-detection-and-quieter-fence.md),
  [ADR-0019](ADR-0019-fence-counts-only-accepted-adr-references.md)

This ADR refines ADR-0010 and does not supersede it.
