# ADR-0022: The Lesson Area Bar Is Relative To The File's Best Area

## Status

Proposed

## Context

1.6.0 grouped `LESSONS.md` into areas with a fixed bar (`MIN_AREA_SCORE = 8`): areas clearing it
ride with the pointers, the rest only the `More lessons:` index line. The bar was tuned on the long
lessons fixture, where wanted areas score 9.96–31 and shared-word noise reaches 7.45.

Measured against a real repository's short-area `LESSONS.md` (8 areas of 2–5 short bullets, shared
on 28 September 2026), the correct area scores below the bar: a genuine two-to-four-term match lands
at 3.0–7.8 there, while the fixed bar demands 8. The fixture's scores are inflated because its areas
are long and its vocabulary unusually distinct; BM25 magnitudes are corpus-dependent (a term's idf
is measured over the file's own bullets), so no fixed bar transfers across files. Reproduced on a
short-shape fixture of our own (`tests/fixtures/lessons-short-areas.md`): wanted 4.53–7.58,
single-word noise 0–2.88.

No single number separates both corpora: any bar low enough for the short file (at most 4.53) admits
the long fixture's noise (up to 7.45). Since 1.8.0, ADR-0021's specificity rule keeps single-word
noise off the unasked path, but the explicit `persist context "<task>"` path stays broad by design,
so the bar cannot lean on specificity either.

## Decision

An area clears the bar on score when it scores at least the floor (`MIN_AREA_SCORE = 3.5`) **and**
at least half the file's best-scoring area (`AREA_FRACTION_OF_BEST = 0.5`) — the higher of the two.
Relevance is comparative within a file: the strongest match sets what "about this task" means here.
The floor answers only "is anything here evidence at all", and is what keeps a task with no relevant
area silent.

Measured separation: the closest wanted second area sits at 0.71 of its file's best ("migrate
session storage", Auth 9.96 vs Mongo 14.12), while the strongest excluded overlaps sit at 0.36
(Deploy noise, Mongo 7.45 vs 20.69) and 0.45 (short-shape shared-word noise, 2.88 vs 6.39) — one
half separates both corpora with margin on each side. The floor sits between short-file noise (at
most 2.88) and the weakest short-file genuine match (4.53).

An area's three bullets are now the ones that matched, best-scoring first, then the rest in the
author's order. The per-bullet scores already existed — the area's score is its best bullet — but
the reader was handed the area's _first_ bullets, so a 15-bullet area answered "keytar
dependency-cruiser vitest" with `git checkout`, `git stash pop` and a pre-commit note. Admitting an
area whose relevance is spread across its bullets is worth little if the lines shown are not those
bullets.

Unchanged: `MAX_LESSON_AREAS = 2` and `MAX_LESSON_BULLETS = 3`, the flat legacy file, the
`## Always` section, the named-area rule, the `More lessons:` index line, the hook's specificity
rule, and the explicit/hook split. This changes how relevant an area must be, never how specific.

## Applies To

- `src/core/context/search.ts`
- `src/commands/context/find.ts`

## Alternatives Considered

- **Lower the fixed bar to ~4.** Rejected on measurement: the long fixture's noise (7.45) clears it,
  so the Deploy prompt would hand over Mongo indexes against its pinned expectations.
- **Score an area by the sum of its bullets instead of its best.** Rejected: it inflates long areas
  (every overlapping bullet adds) without lifting concentrated short-file matches, so the bar would
  have to rise and short files would be harder to deliver, not easier.
- **A purely relative bar with no floor.** Rejected: when the file's best area scores near zero
  (nothing relevant), half of nothing is nothing and every area would clear it. The floor is what
  keeps those tasks silent.
- **Keep the fixed bar of 8.** Rejected: it reproduces the reported defect — short real-shape
  areas/bootstrapped repositories stay silent on genuine matches, and the memory that carries
  judgement never arrives.

## Consequences

Short files now deliver genuine matches instead of staying silent, and long files keep excluding
their noise: the 1.6.0 fixture expectations, the legacy flat file, `Always`, the named-area rule,
the `More lessons:` line, the hook's specificity tests, and the retrieval benchmark's pinned recall
are all unchanged and green.

The cost is a second constant where one stood: the floor and the fraction must be re-measured
together against both corpora if either moves, and the numbers live in the code comment next to
them. A short file whose best area is itself weak (top below the floor) still stays silent — the
floor does not distinguish "weakly relevant" from "irrelevant", it only refuses to guess.

## Related Documents

- Product:
- Architecture:
- Security:
- Feature:
