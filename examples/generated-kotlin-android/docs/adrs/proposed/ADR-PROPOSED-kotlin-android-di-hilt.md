# Proposed ADR: Use Hilt

## Status

Proposed

## Context

The app needs a dependency injection approach for testability and lifecycle scoping.

## Decision

Consider Hilt for dependency injection, awaiting human acceptance.

## Alternatives Considered

- Koin.
- Manual constructor injection.

## Consequences

- Compile-time validation and Android lifecycle scopes.
- Adds annotation processing to the build.
