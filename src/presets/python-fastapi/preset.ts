import type { Preset } from "../../core/presets/preset-schema.js";

const guidance = `# Python FastAPI Preset Guidance

This guidance is proposed, not accepted. Convert any choice you adopt into an accepted ADR in
repository memory. Until then, treat everything here as a recommendation awaiting human review.

## Decision forks this stack forces

- Web framework: FastAPI vs Flask vs Django REST.
- Database and access: PostgreSQL with SQLAlchemy and Alembic vs an async ORM vs raw SQL.
- Validation and settings: Pydantic v2 models and settings.
- Testing: pytest with httpx vs unittest.
- Background work and caching: Redis, task queues, and async workers.

## Recommended structure (proposed)

- A layered layout: \`api/\` routers, \`services/\` logic, \`repositories/\` data access, \`models/\` schemas.
- Dependency injection through FastAPI dependencies.
- Configuration via Pydantic settings loaded from environment variables.

## Testing (proposed)

- pytest with the FastAPI test client or httpx \`AsyncClient\`.
- A disposable test database and transactional fixtures.
- Contract tests for request and response schemas.

## Security considerations (proposed)

- Load secrets from environment or a secret manager, never from source.
- Validate and constrain all input with Pydantic models.
- Scope authentication and authorization at the dependency layer.
`;

function proposedAdr(topic: string, title: string, body: string) {
  return {
    id: `python-fastapi-${topic}`,
    title,
    status: "proposed" as const,
    destination: `docs/adrs/proposed/ADR-PROPOSED-python-fastapi-${topic}.md`,
    body,
  };
}

export const pythonFastapiPreset: Preset = {
  id: "python-fastapi",
  name: "Python FastAPI",
  description: "Opinionated Python FastAPI opinion pack with proposed decisions only.",
  templates: [
    {
      destination: "docs/ai/presets/python-fastapi-guidance.md",
      description: "Python FastAPI guidance that remains proposed until accepted.",
      content: guidance,
    },
  ],
  guidance: [
    {
      title: "Keep framework and data choices proposed",
      body: "FastAPI, the database and ORM, validation, and testing choices must remain proposed until accepted in repository memory.",
    },
    {
      title: "Validate all input",
      body: "Use Pydantic models at the boundary, but record the validation approach as a proposed decision before treating it as accepted.",
    },
  ],
  proposedDecisions: [
    proposedAdr(
      "framework",
      "Use FastAPI",
      `# Proposed ADR: Use FastAPI

## Status

Proposed

## Context

The service needs a Python web framework for an async API.

## Decision

Consider FastAPI as the web framework, awaiting human acceptance.

## Alternatives Considered

- Flask.
- Django REST Framework.

## Consequences

- Async support and automatic OpenAPI docs.
- Requires comfort with type hints and dependency injection.
`,
    ),
    proposedAdr(
      "database-postgres",
      "Use PostgreSQL with SQLAlchemy and Alembic",
      `# Proposed ADR: Use PostgreSQL with SQLAlchemy

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
`,
    ),
    proposedAdr(
      "validation-pydantic",
      "Use Pydantic for validation and settings",
      `# Proposed ADR: Use Pydantic

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
`,
    ),
    proposedAdr(
      "testing-pytest",
      "Use pytest for testing",
      `# Proposed ADR: Use pytest

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
`,
    ),
    proposedAdr(
      "cache-redis",
      "Use Redis for caching and background work",
      `# Proposed ADR: Use Redis

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
`,
    ),
  ],
};
