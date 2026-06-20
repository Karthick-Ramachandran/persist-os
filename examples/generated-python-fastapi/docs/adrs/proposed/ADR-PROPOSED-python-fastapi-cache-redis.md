# Proposed ADR: Use Redis

## Status

Proposed

## Context

The service may need caching, rate limiting, or a task queue backend.

## Decision

Consider Redis for caching and background work, awaiting human acceptance.

## Alternatives Considered

- In-process caching only.
- A managed queue service.

## Consequences

- Fast shared cache and queue backend.
- Adds an operational dependency to run and monitor.
