# Acceptance Criteria: Engineering Conventions Memory

## Criteria

1. `persist init` generates `docs/60-engineering/CONVENTIONS.md` and
   `docs/60-engineering/LESSONS.md` with non-empty, neutral scaffolds.
2. Generated `AGENTS.md` lists both new docs under required reading.
3. A bare `persist init` repo passes `persist doctor` (exit 0) — neither new doc fails a clean repo.
4. Once a repository has real work (a feature, module, or accepted ADR) and `CONVENTIONS.md` is
   still the unfilled template, `persist doctor` emits a `content-conventions` warning (exit 1), and
   stops warning once the canonical-primitives section is filled.
5. `LESSONS.md` never produces a doctor finding, filled or empty.
6. `persist skill list` includes `conventions-adherence`, and
   `persist skill create conventions-adherence` writes a valid, script-free SKILL.md.
7. All existing gates pass with zero regression: typecheck, lint, format, build, full test suite,
   `persist doctor`.

## Out Of Scope

- A deterministic check that code actually reused a primitive (semantic; belongs to the skill).
- A `LESSONS.md` stub check (an empty lessons file is valid for a new repository).
- Any stack-specific opinions, network, telemetry, or runtime behavior.
