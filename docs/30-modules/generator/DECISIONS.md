# Generator Decisions

## P3: Placeholder Renderer First

P3 uses an internal deterministic placeholder renderer instead of Eta or another advanced template
engine.

See:

- `docs/adrs/ADR-0001-deterministic-placeholder-renderer.md`

## P3: No File Writes

The generator module does not write files directly.

Rendered content must be handed to filesystem planning and safe-write modules in later milestones.

## P3: Agent Memory Is Durable Docs

Root agent files are routing entry points, not reliable memory guarantees.

Generator outputs should preserve important project memory in durable docs so humans, agents, and
future doctor checks can re-read and validate it.

## P5: In-Code Init Templates

P5 uses concise in-code templates for the minimal init skeleton.

Template file loading remains future work.

## P6: Feature Docs Are Starter Memory

P6 generates concise feature document structure, not complete PRDs or implementation plans.

Humans or agents fill in feature substance after the feature memory folder exists.

## P7: ADR Docs Are Proposed Drafts

P7 generates concise ADR drafts with status `Proposed`.

Humans accept ADRs by reviewing and editing repository memory.

## P8: Module Docs Are Starter Memory

P8 generates concise module memory structure, not completed module ownership analysis.

Humans or agents fill in module substance after the module memory folder exists.

## P9: Command Reference Is Local Memory

P9 adds `docs/ai/PERSIST_COMMANDS.md` to init output.

This document is generated locally from in-code starter content. It must not be downloaded from the
network in MVP.

## P10: Persist Command Memory

P10 renames generated command memory to `docs/ai/PERSIST_COMMANDS.md`.

The command reference includes `persist preset list` and remains local generated memory.

## Minimal Templates (ADR-0007)

`persist init` generates six documents plus the ADR index; `PRODUCT.md` replaces PRD/BRD as a
fill-in template. Feature/module READMEs are flag-gated opt-in scaffolding. The feature scaffold is
PLAN.md + TASKS.md (+ TEST_PLAN.md only with the test gate on).
