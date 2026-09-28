# ADR-0021: The Prompt Hook Speaks Only On A Specific Match

## Status

Accepted

## Context

The prompt hook runs on every message and injects the pointers it finds. Real use in an outside
project reported the result plainly: the accepted decisions, the doctor warnings, the lessons and
the fences all helped, but "most cards injected in this session didn't fit the task, and each one
costs tokens". Cards were arriving on messages that merely used the words "time", "go", "one",
"4", "place" or "said".

The cause is in the scoring, not in the cards. BM25 rates a term by how rare it is *in this
repository's records*, so an everyday word that happens to appear in one card looks as
distinctive as a domain term. Measured on a four-card fixture, the noise scored higher than the
genuine single-word hits: "go" 5.69 and "time" 3.74 against "renewal" 2.46 and "recipe" 2.12. A
score threshold therefore cannot separate them, and `MIN_SCORE` was already tuned for recall.

Two situations are being served by one rule. When someone runs `persist context "<task>"` they
asked a question, and a weak lead costs them one glance. When the hook fires on every message,
nobody asked, and a weak lead costs the reader tokens and trains them to skim past the pointers —
including the ones that matter.

## Decision

- A record handed over **unasked** must overlap the task specifically: two or more distinct
  matched terms, or one term that names the record (its title or Also Known As), or one term the
  task spelled as a path together with a record that covers that file.
- Layout words and file extensions (`src`, `lib`, `ts`, `test`, …) never count toward the two-term
  test: they say where code lives, not what it is.
- A bare number never names a record and never counts toward the two-term test. An area headed
  "Subscription presets (ADR-0025 §4 terms record)" made the message "4" a naming match in a real
  repository. An identifier carrying digits (`E11000`, `utf8`) is not a bare number.
- A file-name bridge is not specific on its own. It fires on the same everyday words, reaching
  every file under a folder whose name matches one.
- The rule applies to context cards, to secondary records (ADRs, fences, conventions, loose
  lessons), and to lesson areas, whose heading and Also Known As are their naming fields.
- Areas left out for this reason still ride the `More lessons:` index line, so nothing becomes
  invisible.
- An explicit `persist context "<task>"` is unchanged: every hit above `MIN_SCORE` is shown.

## Applies To

- `src/core/context/search.ts`
- `src/commands/context/find.ts`
- `src/commands/context/hook.ts`

## Alternatives Considered

- **Raise the score bar for the hook.** Rejected on measurement: the noise outscored the real
  single-word hits, so no threshold separates them.
- **A list of everyday words to ignore.** Rejected: it guesses what is meaningless in someone
  else's domain. "Time" matters in a scheduler and "place" in a maps application, and the same
  word is noise elsewhere. The naming-field rule needs no such list.
- **Apply the rule everywhere, including explicit lookups.** Measured: held-out paraphrase recall
  fell from 0.69 to 0.44 at rank 3, because a paraphrase often shares exactly one word with the
  card it wants. Someone who asked is better served by the weaker lead.
- **Drop the per-message hook.** Rejected: the reported value of the hook is real when the match
  fits; the defect is precision, not the idea.

## Consequences

Most messages now inject nothing, which is the intended outcome: the pointers are handed over
when they fit and stay quiet otherwise. A card that shares one ordinary word with the task no
longer arrives unasked, and a card named by that word still does.

The cost is borne by paraphrases: a message that shares a single non-naming word with the right
card gets nothing from the hook. The recovery path is the habit the rules already carry — add the
task to the card's Answers list in the phrasing it was asked — and an explicit lookup still finds
the weaker lead.

The two paths can now drift: a repository where the hook stays silent and `persist context` is
useful is working as designed, but the difference has to be documented or it reads as a bug.

## Related Documents

- PRD:
- Architecture:
- Security:
- Feature:
