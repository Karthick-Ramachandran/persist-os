# Proposed ADR: Use Room

## Status

Proposed

## Context

The app needs structured local persistence.

## Decision

Consider Room for local relational persistence, awaiting human acceptance.

## Alternatives Considered

- SQLDelight.
- DataStore for simple key-value needs.

## Consequences

- Compile-time verified SQL and Flow integration.
- Schema migrations must be maintained.
