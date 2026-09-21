# ADR-0015: Context Cards And Prompt Lookup

## Status

Proposed

## Context

When a task reaches an agent ("make rounding fair"), the agent explores the codebase to find
where to start and what rules apply. That costs reading, and it misses what is not visible in
code: the decision governing the area, the reason a piece of logic is shaped the way it is, the
mistake someone already made there. Persist already records those (ADRs, fences, conventions,
lessons) but nothing connects a new task to the right records.

The agent that finishes work in an area understands it better than anyone will for months. That
is the moment to write down, in a small structured file, what the area is for, which tasks it
answers, the words people use for it, where to start reading, and which rules apply. Later, a
plain deterministic search matches a new task against those stored phrases.

The governing principle: **store the meaning when it is known; retrieve it deterministically.**
No embeddings, no model calls, no network, no new dependencies — `commander` and `zod` stay the
whole budget. The quality comes from what is stored, not from a clever matcher.

## Decision

Persist OS gains context cards: one Markdown file per area of the codebase at
`<docsDir>/context/<name>.md`, so cards follow a moved memory folder. Cards are optional; a
repository with none works exactly as today.

### The record

Seven exact headings — Purpose, Answers, Also Known As, Start Here, Rules, Pitfalls,
Applies To. **Answers is the most important field**: task phrasings in the words a user or
agent would type, not code words. Rules and Pitfalls are pointers (ADR ids, fence paths,
convention names, lesson lines), never copies — a card that duplicates an ADR goes stale when
the ADR changes. Applies To reuses ADR pattern syntax (`matchesPattern`), not a second one.

The reader is tolerant where the writer is human: unknown sections ignored, missing sections
treated as empty, bullets with or without backticks. Hand-editing is expected here (unlike
FENCES.md, the fields are prose), so strictness would punish the workflow the feature needs.
`persist context add <name> --purpose "<one line>"` scaffolds the exact shape through the
write plan and refuses to overwrite; `--dry-run` writes nothing; it refuses outside an
initialised repository, like `fence add`.

### The lookup

`persist context "<task>"` scores cards with BM25 (k1 = 1.2, b = 0.75) per field. Field weights,
in one place (`FIELD_WEIGHTS`): Answers 3, Also Known As 2.5, Purpose 2, title 2,
Rules/Pitfalls 1, Start Here 1. Answers dominates because it carries the asker's own words;
Rules/Pitfalls/Start Here are code-word heavy and only disambiguate. A `git ls-files` bridge
boosts records covering a file the task names (a task saying "tip" boosts records covering the tip module); each boosted
record names the files behind the boost (`matched: tip (via src/lib/tip.ts)`). The boost applies only alongside a field
score — a file-name match alone stays silent instead of printing an empty `matched:` line. Ties break by path, so output
never reorders between runs. Below `MIN_SCORE` (0.9) nothing is shown — showing nothing beats showing noise. Exit 0 either way.
Suffixes strip to a fixpoint (so "recordings" meets "record"), with the bare plural firing at most once per token.

When no card covers the task, out-of-vocabulary prompt words get one spelling suggestion each (Damerau distance, budgeted by
length: 1 edit for 4–7 letters, 2 beyond) drawn only from card words, and the corrected query runs as a second pass — shown as
`logn≈login`. Corrections never run first, so exact matches are preserved bit-for-bit. Only then do the closest accepted ADRs,
fences, conventions, and lessons list instead, marked as such. Output is pointers and short lines, never whole files, with
`--json` carrying the same content.

Tuning record: the brief's weights passed the 22-prompt stored set unchanged (recall@1 1.0,
recall@3 1.0), so only the threshold was set, at 0.9 — high enough that an unrelated prompt
scores nothing, low enough that every benchmark prompt clears it. A 16-prompt held-out paraphrase
set (no stored phrases, contamination-guarded) recalls 7/16 at rank 1 and 11/16 in the top 3;
weights and threshold were never tuned against it.

### Keeping cards honest

A `context-cards` doctor check: dead Start Here paths (warning, naming card and path),
Applies-To staleness reusing the staleness check's 90-day gap and git plumbing (warning),
empty Answers lists (info — such a card can never be found), and not-evaluated with a reason
when there are no cards. Cards are also scanned by the `superseded` check and covered by
`ignored-files`.

### Delivery, layered

1. A `context` skill (both skill targets) holds the procedure: look up before starting, read
   only what is pointed at, update the card when done. One rule line in the AGENTS.md template
   and the Cursor rule wires the habit everywhere, with or without a hook. The SessionStart
   text carries the write-when-fresh half: the agent that just finished knows the area best.
2. A prompt hook where the tool's current official docs confirm one that can add context to
   the prompt (findings below). `persist context --hook <tool>` reads the hook input from
   stdin and prints the tool's expected output with at most about 1,500 bytes of pointers —
   nothing below the threshold. The generated script always exits 0, runs only when `persist`
   is on PATH or in `node_modules/.bin`, never calls `npx`, and never writes the prompt to
   disk. Wiring files are created when missing, never merged.
3. A `contextHook` boolean in `.persist/config.json`, default `true`, optional on read so
   existing configs keep loading (ADR-0011: no breaking budget spent).

### Per-tool hook findings

Researched against each tool's current official documentation in September 2026, not memory.

| Tool | Docs URL | Hook | Input | Context-return | Verdict |
| ---- | -------- | ---- | ----- | -------------- | ------- |
| Claude Code | https://code.claude.com/docs/en/hooks.md | `UserPromptSubmit` | JSON on stdin: `prompt` plus `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name` | Plain-text stdout, or JSON `hookSpecificOutput.additionalContext` (exit 0). Default 30s timeout for command hooks; output discarded on timeout, prompt still reaches Claude | Implemented: `.claude/hooks/context-prompt.sh` + settings entry (timeout 10). The settings command uses `${CLAUDE_PROJECT_DIR}/...` per the documented example, and the script cds there first, so prompts fired from subdirectories still resolve config and `node_modules` |
| Codex | https://learn.chatgpt.com/docs/hooks | `UserPromptSubmit` | JSON on stdin: common fields (`session_id`, `transcript_path`, `cwd`, `hook_event_name`, `permission_mode`) plus `turn_id` and `prompt` | Plain-text stdout as developer context, or JSON `hookSpecificOutput.additionalContext`. Block via `decision: block` or exit 2 | Implemented: `.codex/hooks/context-prompt.sh` + `.codex/hooks.json` (timeout 10). Events nest under a top-level `hooks` key per the documented workspace example (a top-level event is silently ignored); the command resolves the script from `git rev-parse --show-toplevel`, and the script cds there first. Note: project hooks need trust review (`/hooks`) before they run |
| Cursor | https://cursor.com/docs/agent/hooks | `beforeSubmitPrompt` | JSON on stdin: `prompt` plus `attachments` | None documented: output is only `continue` (boolean) and `user_message` (shown when blocked). The hook can validate or block a submission, not add context to it | Skipped, deliberately. Cursor is covered by the `context` skill and the Cursor rule line, which work without a hook |

## Applies To

- `src/core/context/**`
- `src/commands/context/**`
- `src/core/doctor/checks/context-cards-check.ts`
- `src/core/skills/skill-catalog.ts`
- `src/core/hooks/generate-hook.ts`

## Alternatives Considered

- **Embeddings or a model rerank for matching.** Rejected: network calls, API costs, and
  nondeterminism violate the product's local-first constraints, and the benchmark shows stored
  phrasings plus BM25 already recall 1.0 on paraphrases. Clever matching is the wrong place to
  spend; the storage format and the writing habit are.
- **Bulk-generate cards from code (adopt sweep, init template).** Rejected for the same reason
  fences are never bulk-generated (ADR-0010): a guess inferred from source is worse than no
  entry, and a directory of stale cards teaches agents to ignore the lookup.
- **One global index file instead of one file per area.** Rejected: per-area files move with
  the area, diff cleanly, and let the doctor check and the `superseded` scan treat each card
  independently. A single file would also need an overwrite-by-default writer, against
  convention.
- **Cursor prompt hook via `beforeSubmitPrompt`.** Rejected on the docs: the documented output
  contract cannot return context. Printing extra stdout would rely on undocumented behaviour —
  and community reports say Cursor requires JSON on stdout and errors on plain text. The skill
  plus the rule line deliver the same lookup with no hook.
- **Blocking doctor severity for dead or stale cards.** Rejected: like the fence (ADR-0010),
  this feature's quality depends on agents, and a block whose satisfaction is "an agent wrote
  something plausible" teaches plausible writing. Warnings an agent reliably acts on are worth
  more.
- **Threshold at zero (always show the best card).** Rejected: showing noise trains agents to
  skip the lookup output entirely. An honest miss keeps the channel trustworthy.

## Consequences

**Improves.** The knowledge that currently evaporates when a task ends gets a home, and the
next task in the area starts from pointers instead of exploration. Deterministic retrieval
means every match explains itself and the output is stable across runs. Layered delivery
means no single tool carries the feature: hooks where docs confirm them, the skill and one
rule line everywhere else.

**Worsens.** Cards are useless on day one and only compound with the write-when-fresh habit,
which is the hardest part to demonstrate in a first run — same adoption curve as the fence.
The prompt hook adds one local process spawn per prompt (bounded by the 10s timeout, silent
on miss). New generated files mean existing repositories see hook-drift guidance until
`persist hooks sync` runs.

**Risks.** Cards full of code words instead of task phrasings retrieve poorly — mitigated by
the Answers-first format, the skill procedure, and the unanswerable info finding, but not
eliminated. The 22-prompt benchmark is a fixture, not the field: real phrasings will miss,
and the miss only shows as silence. Weights and threshold were tuned to this fixture; if real
usage shows noise above 0.9 or misses below it, retune against a broader prompt set and record
the change here.

## Related Documents

- Product: `docs/00-product/PRODUCT.md`
- Architecture: `docs/10-architecture/ARCHITECTURE.md`,
  `docs/10-architecture/MEMORY_ENGINE.md`
- Security: `docs/20-security/SECURITY_MODEL.md`
- Feature: `docs/60-engineering/LESSONS.md`
- Related: [ADR-0010](ADR-0010-chestertons-fence.md),
  [ADR-0011](ADR-0011-one-zero-stability-contract.md)
