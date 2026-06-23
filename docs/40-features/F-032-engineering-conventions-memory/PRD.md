# PRD: Engineering Conventions Memory

## Purpose

A large share of low-quality AI output comes from the agent inventing a new component, helper, or
pattern when a canonical one already exists, and from repeating mistakes the team already learned
from. High-quality AI setups solve this by giving the agent a named, reusable vocabulary plus a
record of hard-won lessons that load every session. Persist scaffolds rich memory but has no
first-class place for either, so the agent has nothing to reuse against and no durable lessons. This
feature adds two architecture-neutral memory docs — Conventions (canonical vocabulary and
falsifiable rules) and Lessons (durable pitfalls) — that load into every agent session, plus a
deterministic nudge that the conventions doc gets filled once a repository has real work.

## In Scope

- A generated `docs/60-engineering/CONVENTIONS.md` scaffold: canonical primitives, naming
  conventions, falsifiable rules, anti-patterns.
- A generated `docs/60-engineering/LESSONS.md` scaffold: durable, reviewed pitfalls and what to do
  instead.
- Both docs added to `AGENTS.md` required reading so every agent reloads them.
- A deterministic `doctor` content check that warns when `CONVENTIONS.md` is still an unfilled
  template, but only once the repository has real work (a feature, module, or accepted ADR) — bare
  `persist init` stays green.
- A portable `conventions-adherence` agent skill that reviews a change for reuse-over-reinvent
  against `CONVENTIONS.md` (semantic work stays with the agent; the gate stays structural).

## Non-Goals

- No deterministic check that code actually reused a primitive (that needs semantic understanding;
  it belongs to the skill, not the gate).
- No `LESSONS.md` stub check — an empty lessons file is valid for a new repository.
- No new runtime behavior, network, telemetry, or stack-specific opinions. The docs are neutral
  scaffolds the team fills in.
