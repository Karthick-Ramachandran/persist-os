# Python FastAPI Preset Guidance

This guidance is proposed, not accepted. Convert any choice you adopt into an accepted ADR in
repository memory. Until then, treat everything here as a recommendation awaiting human review.

## Decision forks this stack forces

- Web framework: FastAPI vs Flask vs Django REST.
- Database and access: PostgreSQL with SQLAlchemy and Alembic vs an async ORM vs raw SQL.
- Validation and settings: Pydantic v2 models and settings.
- Testing: pytest with httpx vs unittest.
- Background work and caching: Redis, task queues, and async workers.

## Recommended structure (proposed)

- A layered layout: `api/` routers, `services/` logic, `repositories/` data access, `models/`
  schemas.
- Dependency injection through FastAPI dependencies.
- Configuration via Pydantic settings loaded from environment variables.

## Testing (proposed)

- pytest with the FastAPI test client or httpx `AsyncClient`.
- A disposable test database and transactional fixtures.
- Contract tests for request and response schemas.

## Security considerations (proposed)

- Load secrets from environment or a secret manager, never from source.
- Validate and constrain all input with Pydantic models.
- Scope authentication and authorization at the dependency layer.
