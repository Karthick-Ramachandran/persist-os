# Repository Decisions

## Purpose

Repository decisions are architecture, product, security, testing, dependency, platform, and workflow decisions accepted by the repository owner or team.

They are the source of truth for a specific repository.

## Examples

A solo founder may accept:

- Use Supabase.
- Use Stripe.
- Use Next.js.

A startup may accept:

- Use Firebase.
- Use Sentry.
- Use GitHub Actions.

An OSS maintainer may accept:

- Use Node.js LTS.
- Use Vitest.
- Use local-first docs only.

SpecForge does not judge these choices. It records them and helps agents follow them.

## Relationship To ADRs

Durable repository decisions should be captured as ADRs or equivalent accepted docs.

ADRs are required when decisions affect:

- Architecture style.
- Dependencies.
- Auth, secrets, storage, networking, telemetry, or file writes.
- Module boundaries.
- Security posture.
- Runtime MCP.
- Preset or plugin execution model.

## Relationship To Presets

Presets may generate proposed decisions.

A proposed decision becomes repository memory only after the human accepts it.

Preset guidance must not be treated as accepted repository truth by default.

## Drift Rule

Drift is mismatch with accepted repository decisions.

If implementation uses Redis but accepted repository memory says Supabase queues are the queueing strategy, that is drift.

If implementation uses Redis and the repository has accepted Redis, that is not drift.

SpecForge validates consistency with the repository's chosen memory, not with SpecForge's preferences.
