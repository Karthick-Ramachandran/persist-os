# PRD: Strategic Reframe To Architecture-Neutral Memory Engine

## Summary

SpecForge should be positioned as an architecture-neutral AI engineering memory platform.

It should not be understood as an architecture starter kit that tells users which infrastructure, cloud, database, auth provider, or architecture style to use.

SpecForge records, distributes, validates, and protects the architecture decisions a user, repository, organization, or explicitly selected preset provides.

## Users

- Solo founders who need durable memory for their own decisions.
- Startups that need AI agents to follow repository decisions.
- OSS maintainers that need contributors to respect documented architecture.
- Enterprises that need organization standards reflected in repo memory.

## Goals

- Make `specforge init` neutral by default.
- Keep `preset` as the CLI term.
- Define presets architecturally as opinion packs.
- Distinguish Memory Engine, Repository Decisions, Opinion Packs, and Organization Memory.
- Redefine drift as mismatch with accepted repository memory.
- Remove language implying SpecForge Core makes architecture choices.

## Non-Goals

- Implementing `adopt`.
- Implementing `import standards`.
- Changing runtime config schema.
- Implementing preset runtime behavior.
- Implementing CLI changes.
- Adding new dependencies.

## Strategic Principle

SpecForge is intentionally architecture-neutral.

Its role is not to determine what architecture a team should adopt.

Its role is to ensure that architecture decisions, regardless of their content, become durable, reviewable, AI-readable repository memory.
