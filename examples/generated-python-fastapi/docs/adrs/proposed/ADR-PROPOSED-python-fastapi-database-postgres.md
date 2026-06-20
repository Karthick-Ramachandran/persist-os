# Proposed ADR: Use PostgreSQL with SQLAlchemy

## Status

Proposed

## Context

The service needs a relational database and a migration strategy.

## Decision

Consider PostgreSQL with SQLAlchemy and Alembic migrations, awaiting human acceptance.

## Alternatives Considered

- An async ORM such as Tortoise or SQLModel only.
- Raw SQL with a lightweight driver.

## Consequences

- Mature tooling and explicit migrations.
- Requires session and connection management discipline.
