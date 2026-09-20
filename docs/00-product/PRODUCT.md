# Product: Persist OS

## Purpose

Persist OS creates durable engineering memory for AI-assisted software development: ADRs, module
docs, feature plans, and standards that live in the repository and are validated by a deterministic
gate (`persist doctor`).

## Users

Teams whose coding agents need persistent context across sessions, and who want that context
reviewed in pull requests like any other code.

## Non-Goals

Persist OS does not make architecture choices for users, run AI models, execute tools from memory,
or generate production application code. It records, distributes, validates, and protects decisions
— it does not make them.

## Current Status

Pre-1.0. The 1.0 milestone ships minimal-by-default memory, a real test gate, and rewritten doctor
checks against the surviving memory.
