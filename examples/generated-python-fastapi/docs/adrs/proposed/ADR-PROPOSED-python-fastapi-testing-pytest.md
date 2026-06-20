# Proposed ADR: Use pytest

## Status

Proposed

## Context

The service needs a test framework and HTTP testing approach.

## Decision

Consider pytest with httpx for API tests, awaiting human acceptance.

## Alternatives Considered

- unittest.
- nose-style runners.

## Consequences

- Concise fixtures and rich plugins.
- Teams must standardize fixture and database setup.
