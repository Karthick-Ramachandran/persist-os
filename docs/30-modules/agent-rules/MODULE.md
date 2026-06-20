# Module: Agent Rules

## Purpose

Agent rules define how AI tools should behave when working in the repository.

## Owns

- Repository rules override model preferences.
- AI stop conditions.
- Required reading for agents.
- Completion evidence behavior.

## Does Not Own

- Tool-specific runtime integrations.
- MCP server behavior.
- AI model selection.
- Runtime enforcement.

## Current Decision

Agents must follow repository memory over model preference and stop when instructions conflict.
