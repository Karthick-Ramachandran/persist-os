# Plan: Persist OS 1.0

Sequencing for the 1.0 release. The decisions themselves live in ADR-0007 through ADR-0012; this
document is only about order, dependencies, and risk.

Status: **proposed**. Nothing here is built until the ADRs are accepted.

## The shape of the change

|                              | 0.6.2                      | 1.0                                   |
| ---------------------------- | -------------------------- | ------------------------------------- |
| Required documents           | 14 (~60KB+)                | 6 + `docs/adrs/`                      |
| Files per feature            | 9                          | 2, or 3 with the test gate            |
| Catalog skills               | 12                         | 3, all rewritten                      |
| `Required Reading` in skills | every skill                | removed                               |
| Scripts in skills            | forbidden                  | allowed, constrained                  |
| Presets                      | 10                         | none                                  |
| Test gate                    | test _files_ changed       | tests _pass_                          |
| Hooks                        | identical lists, ~10s each | doctor at commit, heavy gates at push |
| `persist init`               | flags only                 | interactive, 4 questions              |
| Chesterton fence             | —                          | `FENCES.md`, warn-level               |

## One idea the whole release depends on

**A check that cannot evaluate its input must say so, not pass.**

This project has hit that bug twice already. The staleness check silently evaluates nothing on a
shallow CI clone — `actions/checkout@v4` defaults to `fetch-depth: 1`, every file reports the same
commit timestamp, and doctor prints `PASSED`. And five checks will silently match nothing the moment
ADR-0007 makes their input documents optional.

Both report success while doing no work. For a tool whose pitch is a deterministic gate, that is the
most damaging failure available. So `not evaluated` becomes a first-class doctor outcome before
anything else is built, because phases 2, 3 and 7 all depend on it.

## Phases

Ordered by dependency. Each lands on its own branch behind full gates.

### 1. Foundations

- `not evaluated` as a doctor finding state, surfaced in text and `--json`
- Shallow-clone detection; staleness reports not-evaluated instead of passing
- `fetch-depth: 0` in the generated CI workflow and in this repo's `ci.yml`
- Config schema: remove `preset`; add `testCommand`, `prePushGates`, fence toggle
- Loosen `required-files` to the six-document set

Nothing user-visible breaks. Loosening cannot fail a repository that passes today.

### 2. Keep the gate honest

- Rewrite `memory-integrity`, `standards`, `content`, `code-reference`, `staleness` against ADRs,
  `CONVENTIONS.md`, `LESSONS.md`, `FENCES.md`, `PRODUCT.md`
- New check: generated hooks match the config that produced them
- New check: retired catalog skills still on disk, with the removal command

The largest engineering surface in the release and the most likely place for a silent regression.

### 3. Shrink the output

- `PRODUCT.md` replaces `PRD.md` and `BRD.md`
- Feature scaffold drops to 2 files, 3 when the test gate is on
- Retire presets: 10 directories, ~21 source files, `preset list`, `--preset`

### 4. Skills

- `render-skill.ts` stops stamping a fixed template; sections are earned
- Rewrite `plan-feature`, `security-review`, `conventions-adherence` — new structure, `Verification`
  and `Output` sections, no `Required Reading`, one-hop links into `docs/`
- Retire the other nine
- `scripts/` support with the four constraints from ADR-0012
- Trigger tests per skill: prompts that must activate it, prompts that must not

Depends on phase 3 — skills reference documents, so the document shape settles first.

### 5. Gates

- `testCommand` detection preferring one-shot scripts (`test:run` over `test`)
- Test gate replaces `guard`; `guard` removed
- Hooks split: doctor at pre-commit, heavy gates at pre-push
- Detection covered across Vitest, Jest, pytest, Go, Cargo

### 6. Interactive init

Four questions, plus a non-interactive path so CI and scripted setup keep working. Comes after
phases 1–5 because init can only ask about capabilities that exist.

### 7. The fence — moved to 1.1

**Not in 1.0.0.** ADR-0010 stays Proposed and nothing in `src/` implements it.

ADR-0011's Decision defines 1.0.0 as CLI-surface and config-schema stability and does not name the
fence as a shipping condition; it appears only in that ADR's Context. ADR-0011 also permits adding
optional config fields within 1.x, so a fence toggle and `FENCES.md` can arrive in 1.1 without
breaking the contract.

The fence is also the worst candidate for a release deadline: the risk section below calls it the
one feature whose quality depends on agent behaviour rather than a deterministic check, and rushing
the feature that cannot be gated is how it ships badly.

What 1.1 still has to build, unchanged from the original plan:

- `FENCES.md`, empty on creation
- SessionStart injection, inside the existing 24KB context budget
- Trigger on `adr create` and `adr supersede`
- Pre-commit rule: source change, no fence record, no ADR reference → warn
- `chestertons-fence` skill
- Non-logic exclusion list, visible and overridable

Last because it uses the skill infrastructure from phase 4 and the hook split from phase 5. One
design question is still open and must be settled before it is built: ADR-0007 lists `FENCES.md` in
the surviving memory set, but no generator emits it and nothing defines where it lives. ADR-0010
should have specified the path and did not.

### 8. 1.0 readiness

- Every check: unit tests, a fires-correctly test, and a not-evaluated test
- Every command: end-to-end against a real repository
- Upgrade test: a 0.6.x repository still works on 1.0
- README, `CLAUDE.md`, `AGENTS.md` updated; the scriptless MVP constraint removed
- Migration note naming both breaking changes and the exact edit each needs

## Known risks

**The rewritten checks are where a silent regression hides.** Mitigated by the not-evaluated tests
in phase 1 being written before the rewrites in phase 2, not after.

**A rewritten skill description that routes worse never triggers, and nothing reports it.** Trigger
tests are the only defence.

**Test-command detection picking wrong silently disables the gate.** `persist init` must print the
command it selected.

**The fence depends on agent quality rather than a deterministic check** — the first feature in the
product that does. Warn-level severity is the deliberate hedge; revisit after real usage.

**The 1.0 promise without the evidence.** The bar in phase 8 is substantial and the deadline
temptation is to ship the version number without it. A 1.0 that breaks at 1.1 is worse than an
honest 0.7.

## Superseded planning

`PIPELINE.md` (local, untracked) predates the Persist OS rename and lists shipped work as pending:
staleness, context budget, conventions and lessons memory, right-size discipline, doctor `--json`.
It should be rewritten against this plan or deleted.

Items still unbuilt and **not** in 1.0, deliberately: the Chesterton fence (phase 7 above),
`persist upgrade`, doctor baseline for legacy adoption, `persist task` and tracker integration,
organization memory. The fence and `persist upgrade` are the two worth doing first in 1.1.

## Related documents

- [ADR-0007](../adrs/ADR-0007-minimal-by-default-repository-memory.md) — minimal by default
- [ADR-0008](../adrs/ADR-0008-skill-architecture-progressive-disclosure.md) — skill architecture
- [ADR-0009](../adrs/ADR-0009-gates-verify-tests-pass.md) — gates verify tests pass
- [ADR-0010](../adrs/ADR-0010-chestertons-fence.md) — Chesterton's fence
- [ADR-0011](../adrs/ADR-0011-one-zero-stability-contract.md) — 1.0 stability contract
- [ADR-0012](../adrs/ADR-0012-generated-skills-may-ship-scripts.md) — scripts in skills
