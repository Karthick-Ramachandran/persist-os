# Proposed ADR: Use async/await and Observation

## Status

Proposed

## Context

The app needs a concurrency and state-observation approach.

## Decision

Consider Swift async/await with the Observation framework, awaiting human acceptance.

## Alternatives Considered

- Combine.
- Completion handlers and delegates.

## Consequences

- Structured concurrency and simpler state flow.
- Requires a recent deployment target.
