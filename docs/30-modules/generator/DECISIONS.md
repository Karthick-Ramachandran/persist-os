# Generator Decisions

## P3: Placeholder Renderer First

P3 uses an internal deterministic placeholder renderer instead of Eta or another advanced template engine.

See:

- `docs/adrs/ADR-0001-deterministic-placeholder-renderer.md`

## P3: No File Writes

The generator module does not write files directly.

Rendered content must be handed to filesystem planning and safe-write modules in later milestones.

## P3: Agent Memory Is Durable Docs

Root agent files are routing entry points, not reliable memory guarantees.

Generator outputs should preserve important project memory in durable docs so humans, agents, and future doctor checks can re-read and validate it.

## P5: In-Code Init Templates

P5 uses concise in-code templates for the minimal init skeleton.

Template file loading remains future work.
