# AI Agent Rules

## Purpose

These rules define how AI agents should behave when working in this repository.

They apply to Claude, Codex-compatible tools, Cursor, Copilot-style agents, and future AI coding tools.

## Core Principle

Repository rules override model preferences.

If the model suggests one thing and repository memory says another, the repository wins.

## Required Reading

Before non-trivial work, read:

- `AGENTS.md`
- `docs/10-architecture/MEMORY_ENGINE.md`
- `docs/60-engineering/ENGINEERING_STANDARDS.md`
- Relevant product, architecture, security, testing, feature, module, and ADR docs.

## Stop Conditions

Stop and request human decision if:

- User instructions conflict with accepted repository memory.
- A request asks to commit secrets or `.env` contents.
- A request asks to bypass auth, authorization, security review, or tests.
- A dependency is needed without review.
- A migration is needed but not documented.
- Network, telemetry, cloud, runtime MCP, remote templates, auth, secrets, storage, or file write behavior changes without review.
- Completion evidence is missing.

## Work Rules

- Do not jump into code for module work.
- Create or update feature docs and module memory before implementation.
- Implement one task at a time.
- Keep changes scoped.
- Update docs when behavior or standards change.
- Report commands run, results, skipped checks, remaining risks, and docs updated.

## Prohibited Behavior

- Do not invent accepted decisions.
- Do not treat opinion-pack guidance as accepted repository memory.
- Do not use MCP context as source of truth.
- Do not hide skipped checks.
- Do not claim completion based on intent rather than evidence.
