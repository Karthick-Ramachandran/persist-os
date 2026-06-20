# Memory Engine

## Purpose

SpecForge Core is an architecture-neutral memory engine.

It does not decide which architecture, framework, cloud provider, database, queue, auth provider, observability stack, or deployment model a project should use.

SpecForge records, distributes, validates, and protects architecture decisions once humans, repository owners, organizations, or explicitly selected presets define them.

## Strategic Position

SpecForge is intentionally architecture-neutral.

Its role is not to determine what architecture a team should adopt.

Its role is to ensure that architecture decisions, regardless of their content, become durable, reviewable, AI-readable repository memory.

## What Core Knows

SpecForge Core knows how to create and maintain:

- ADRs.
- PRDs.
- Acceptance criteria.
- Architecture impact docs.
- Module memory.
- Engineering standards memory.
- Testing strategy.
- Security and threat model docs.
- Review workflows.
- Architecture drift checks.
- Completion reports.
- Agent instruction files.
- Skill workflow templates.

## What Core Does Not Know

SpecForge Core must not encode product infrastructure choices such as:

- Redis.
- Kafka.
- CloudWatch.
- Datadog.
- Auth0.
- Okta.
- Supabase.
- Firebase.
- Postgres.
- MongoDB.
- S3.
- OpenTelemetry.
- CQRS.
- Event sourcing.
- Clean Architecture.
- Feature-first architecture.

Those may be valid choices, but they are not SpecForge Core decisions.

## Memory Pillars

Repository memory includes:

- Product Memory: why.
- Architecture Memory: what.
- Decision Memory: accepted decisions.
- Engineering Standards Memory: how work is done.
- Module Memory: where responsibilities live.
- Testing Memory: how behavior is verified.
- Security Memory: what must be protected.
- Operational Memory: how the system is run when operational decisions exist.

## Strategic Layers

1. Memory Engine
2. Repository Decisions
3. Opinion Packs
4. Organization Memory

The memory engine remains stable across all users. Solo founders, startups, OSS maintainers, and enterprises bring their own decisions into the same memory system.

## Source-Of-Truth Order

1. Accepted ADRs and repository decisions
2. Architecture docs
3. Engineering standards
4. Current PRD and accepted change requests
5. Security and testing docs
6. Module docs
7. Feature plans
8. Task files
9. MCP external context
10. Chat history

## Neutral Init

The primary path is:

```bash
specforge init
```

This should generate a neutral engineering memory structure with no technology opinions and no architecture opinions.

It must work in an empty folder.

Git initializes source control.

SpecForge initializes repository memory.

Code may come before or after SpecForge.

Optional presets may add stack-aware guidance, but they must not silently create accepted architecture decisions.

## Init Workflows

1. Greenfield: empty folder -> `specforge init` -> app/framework later.
2. Existing repository: app exists -> neutral `specforge init` -> optional detected guidance later.
3. Legacy adoption: mature repo -> future `specforge adopt`.

Technology detection may provide guidance, suggest opinion packs, or draft proposed decisions.

Technology detection must not become accepted repository memory by itself.

## Drift Definition

Architecture drift is not difference from a SpecForge recommendation.

Architecture drift is difference from accepted repository memory.

Redis, Kafka, CloudWatch, Datadog, Supabase, Firebase, and internal enterprise systems are all equally valid when they are accepted repository or organization decisions.
