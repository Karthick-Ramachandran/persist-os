# ADR-0018: Lessons By Area

## Status

Accepted

## Context

`LESSONS.md` is one flat, append-only list, and the rules make agents read all of it. After a few
weeks of work it holds dozens of lessons — push delivery, database indexes, auth sessions, deploy,
background jobs — all mixed, and the file only grows. An agent changing a database index reads
every lesson to find the few that matter, and every session pays for all of them.

## Decision

Keep every lesson, but change what an agent is handed, in three tiers:

1. **Always**: a short `## Always` section of cross-cutting lessons, loaded into every session
   after the fence index, inside the same 24 KB always-loaded budget and truncation rules.
2. **Area sections**: any other `##` heading is an area, with an optional `Applies To` list (same
   patterns as ADRs, matched with `matchesPattern`) and an optional `Also Known As` line.
   `persist context` and the prompt hook hand over only the matching areas — at most two areas,
   three lessons each, after the decisions and Start Here files — plus a one-line `More lessons`
   index naming the rest. A section scores as one document under the same tokenizer and BM25 as
   cards, with heading and Also Known As weighted above bullets.
3. **The index**: `More lessons: <other area titles> (<path to LESSONS.md>)`, kept last under
   the hook's byte cap, so the agent knows where to look when the pointers fall short.

The reader is tolerant, like the context card reader: headings are case-insensitive, both header
lines are optional, wrapped bullets join their bullet above, and a flat file with no `##` sections
reads as one unnamed area, searched bullet by bullet exactly as before. Nothing breaks for
existing repositories, nothing restructures a user's lessons automatically, and `init` never
rewrites an existing `LESSONS.md`.

Doctor keeps the shape honest through the existing checks: the content check warns when `Always`
passes 12 bullets or about 1.5 KB, when the file passes about 12 KB, and when an area's
`Applies To` matches no repository file (noting when a 20-lesson file has no areas at all), and
the code-reference check scans `LESSONS.md` so a lesson citing a deleted file is flagged.

## Applies To

- `src/core/lessons/**`
- `src/core/context/**`
- `src/commands/context/**`
- `src/core/hooks/generate-hook.ts`
- `src/core/doctor/checks/content-check.ts`
- `src/core/doctor/checks/code-reference-check.ts`
- `src/core/doctor/checks/context-budget-check.ts`
- `src/core/generator/generate-init.ts`
- `src/core/skills/skill-catalog.ts`

## Alternatives Considered

- **Keep the flat list and raise no structure.** Rejected: the file only grows, and every task
  keeps paying for every lesson.
- **One file per area.** Rejected: harder to skim, harder to keep (a new file per lesson area),
  and every existing repository would need a migration on day one.
- **A new doctor check module for lessons.** Rejected: the findings fit the content check's
  existing shape, and a new module would move the 19-check count that README, the site, and the
  not-evaluated tests all pin.
- **Hard sections with required headers.** Rejected: strictness punishes the hand-editing the
  feature needs — the context card reader's tolerance is the precedent.

## Consequences

**Improves.** Sessions load only the lessons they need; area lessons arrive with the pointers
that already name the files. Small repositories are unaffected: flat files read as before.

**Worsens.** Lesson lookup has one more scoring path to tune, with its own threshold beside the
card one. Authors must pick an area (and its `Applies To`) for each new lesson.

**Risks.** A wrong area threshold either spams pointers or hides lessons; the 12-prompt fixture
(`tests/fixtures/lessons-by-area.md`) pins the current tuning. Over-grown `Always` sections
recreate the original problem one heading up — the content warning is the backstop.

## Related Documents

- Product: `docs/00-product/PRODUCT.md`
- Architecture: `docs/10-architecture/ARCHITECTURE.md`
- Related: [ADR-0010](ADR-0010-chestertons-fence.md),
  [ADR-0011](ADR-0011-one-zero-stability-contract.md),
  [ADR-0015](ADR-0015-context-cards-and-prompt-lookup.md)
