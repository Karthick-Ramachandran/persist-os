# Proposed ADR: Use Pydantic

## Status

Proposed

## Context

The service needs request validation and typed configuration.

## Decision

Consider Pydantic v2 models for validation and settings, awaiting human acceptance.

## Alternatives Considered

- Marshmallow.
- Hand-written validation.

## Consequences

- Strong typing at the boundary and clear settings.
- Adds Pydantic to the dependency surface.
