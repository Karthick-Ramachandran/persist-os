# ADR-0007: Minimal By Default Repository Memory

## Status

Proposed

## Context

Persist OS generates more memory than most repositories will ever maintain.

Measured on this repository today:

- Doctor errors unless **14 documents** exist (plus `docs/adrs/README.md` and the tool entry files).
  The eleven largest total roughly 60KB. Two of them — `PRD.md` (24.5KB) and `BRD.md` (15KB) — are
  two thirds of that weight on their own.
- `persist feature create` writes **9 files** per feature: PRD, ACCEPTANCE, ARCHITECTURE_IMPACT,
  CHANGE_REQUESTS, PLAN, TASKS, TEST_PLAN, REVIEW, COMPLETION_REPORT.
- Every generated skill carries a `## Required Reading` list. `ENGINEERING_STANDARDS.md` appears in
  9 of 12 skills, `SECURITY_MODEL.md` in 7.

The cost lands on the agent. A repository that adopts Persist OS commits to producing and
maintaining every one of those documents, and an agent that triggers a single skill is told to read
eight more. For most teams the ceremony exceeds the value, and ceremony that exceeds its value does
not get maintained — it rots, and rotted memory is worse than no memory.

A distinction was missing and is worth stating: **this repository's own memory and the memory
Persist OS generates for a user are different products.** Persist OS is a complex project with real
constraints, and its own `AGENTS.md` and docs can stay rich. What `persist init` writes into someone
else's repository must be the minimum that still produces predictable outcomes. The current
generated output was sized for the former.

## Decision

Default generated memory shrinks to the set that earns its place, and everything else becomes
opt-in.

**Always generated and required:**

- `docs/adrs/` — the decision record, with create, accept, and supersede
- `docs/00-product/PRODUCT.md` — one product file, replacing `PRD.md` and `BRD.md`
- `docs/60-engineering/ENGINEERING_STANDARDS.md`
- `docs/60-engineering/CONVENTIONS.md`
- `docs/60-engineering/LESSONS.md`
- `docs/20-security/SECURITY_MODEL.md`
- `docs/50-quality/QUALITY_GATES.md`

Required document count drops from 14 to 6 plus the ADR directory.

**Optional, chosen at init:** features, modules, `ARCHITECTURE.md`, `AI_AGENT_RULES.md`,
`MEMORY_ENGINE.md`, `FILE_WRITE_POLICY.md`, `THREAT_MODEL.md`, `TESTING_STRATEGY.md`, and the
`docs/ai/` strategy documents.

**When features are enabled**, `persist feature create` writes **two** files — `PLAN.md` and
`TASKS.md` — or **three** when the test gate is enabled, adding `TEST_PLAN.md`. Acceptance criteria
fold into `PLAN.md`; completion evidence folds into `TASKS.md`. The third file exists only when
something actually enforces it, so the scaffold never outruns the gate.

**Presets are retired entirely.** All 10 preset directories, the `persist preset list` command, the
`--preset` flag, and the `preset` config field are removed. Presets proposed framework-shaped
opinions, and the same guidance is better delivered by ADRs the team writes themselves. Removing the
config field is a breaking change, made deliberately at the 1.0 boundary — see
[ADR-0011](ADR-0011-one-zero-stability-contract.md).

**`persist init` becomes interactive**, asking four questions and writing the minimum consistent
with the answers:

1. Which AI tools? (`claude`, `codex`, `cursor`, `generic`)
2. Track features?
3. Enable the test gate? — detects the test command if yes
4. Enable the Chesterton fence?

A non-interactive path stays available so CI and scripted setup keep working.

**Five doctor checks lose their inputs** and are rewritten rather than deleted. `memory-integrity`,
`standards`, `content`, `code-reference`, and `staleness` currently read `PRD.md`,
`COMPLETION_REPORT.md`, `REVIEW.md`, `ARCHITECTURE_IMPACT.md`, `MODULE.md`, and `DECISIONS.md`. They
are re-pointed at the memory that survives: ADRs, `CONVENTIONS.md`, `LESSONS.md`, `FENCES.md`, and
`PRODUCT.md`.

This is the most important consequence of the whole change and the easiest to get wrong. A check
whose input no longer exists does not fail — it matches nothing and reports `PASSED`. Silent success
is worse than deletion, because it looks like a working gate. Any check that cannot evaluate must
say so rather than pass.

**Migration loosens only.** Doctor stops requiring the dropped documents, which cannot break a
repository that passes today. A new check reports catalog skills that have been retired but remain
on disk, naming them and the command to remove them, so the user decides when to delete.

## Alternatives Considered

- **A `memoryProfile` setting (lite / standard / strict).** Rejected. That field existed, was
  validated, and was read by nothing; it was removed in 0.7 precisely because an unwired knob is a
  promise the tool does not keep. Reintroducing it would mean maintaining three generated shapes and
  three sets of doctor expectations forever. One good default beats three mediocre ones.
- **Keep the documents, stop requiring them.** Rejected. Generated-but-optional documents are
  clutter that still has to be read past, and a template nobody fills is a lie in the repository.
- **Delete the five orphaned checks instead of rewriting them.** Rejected. It would leave the gate
  materially weaker at exactly the moment we ask people to trust it at 1.0.
- **Keep presets and have them emit less.** Considered and initially preferred. Rejected because the
  presets' remaining job — proposing where business logic lives — turned out not to be needed once
  the fence stopped requiring configured scope.

## Consequences

**Improves.** Adoption cost falls sharply: six documents instead of eleven, two files per feature
instead of nine, and a first run that asks four questions instead of assuming a heavy workflow.
Memory that is small enough to maintain is memory that stays true.

**Worsens.** Teams that genuinely want the full workflow must opt into it. The generated output no
longer demonstrates the complete method on day one, which makes Persist OS look less capable in a
first impression — a real marketing cost accepted for a real maintenance benefit.

**Risks.** The five rewritten checks are the largest engineering surface in 1.0 and the place a
silent regression is most likely. Every rewritten check needs a test proving it fires _and_ a test
proving it reports "not evaluated" rather than passing when its input is absent. Removing the
`preset` config field breaks existing configs and must be paired with a clear upgrade path.

## Related Documents

- PRD: `docs/00-product/PRD.md`
- Architecture: `docs/10-architecture/ARCHITECTURE.md`
- Security: `docs/20-security/SECURITY_MODEL.md`
- Feature: `docs/50-quality/QUALITY_GATES.md`
- Related: [ADR-0008](ADR-0008-skill-architecture-progressive-disclosure.md),
  [ADR-0011](ADR-0011-one-zero-stability-contract.md)
