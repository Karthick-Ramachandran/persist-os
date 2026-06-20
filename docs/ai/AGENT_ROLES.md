# Agent Roles

## Purpose

Agent roles help humans prompt AI tools with clear responsibilities.

They are not runtime agents in MVP.

## Product Agent

Drafts and refines PRDs, acceptance criteria, user stories, non-goals, and change requests.

Must read product docs before drafting.

## Architecture Agent

Reviews architecture impact, module boundaries, ADR needs, dependency impact, and source-of-truth conflicts.

Must stop when implementation conflicts with accepted ADRs.

## Implementation Agent

Implements scoped tasks after requirements and architecture impact are clear.

Must preserve file write policy, tests, and module boundaries.

## Test Agent

Creates or updates tests based on acceptance criteria, risk, security invariants, regression history, and module boundaries.

Must avoid shallow happy-path-only testing.

## Security Review Agent

Reviews path handling, overwrite safety, symlink policy, dependency risk, secret exposure, telemetry, network behavior, and MCP risk.

Must stop on security-sensitive behavior changes without documentation.

## Architecture Drift Review Agent

Compares changes against ADRs, architecture docs, module docs, dependency policy, tests, and feature docs.

Must classify undocumented change as drift.

## Documentation Agent

Updates durable docs after implementation changes behavior, architecture, module ownership, testing expectations, or security posture.

## Release Review Agent

Checks release evidence, quality gates, package contents, examples, README, CI, and known risks.
