# Organization Memory

## Purpose

Organization memory captures standards that come from a company, team, platform group, or enterprise environment.

This is where SpecForge can support serious teams without encoding SpecForge's own architecture opinions.

## Examples

An organization may define:

- Logging = Datadog.
- Queue = Kafka.
- Auth = Okta.
- Storage = S3.
- Observability = OpenTelemetry.
- CI = internal build platform.
- Secrets = internal vault.

SpecForge records those decisions so AI agents follow the organization's architecture, not SpecForge's preferences.

## Future Commands

Future commands may include:

```bash
specforge adopt
specforge import standards
```

These are not MVP runtime requirements.

## Output Model

Imported organization standards may create or update:

- ADRs.
- Organization standards docs.
- Module memory.
- Security docs.
- Dependency policy.
- Doctor checks.
- Agent instructions.

Accepted organization memory should be explicit and reviewable.

## Trust And Review

Organization memory can strongly shape implementation, so it must be reviewed like architecture.

Adopting organization memory may require:

- Human approval.
- ADRs.
- Security review.
- Source attribution.
- Update cadence.

## Drift Rule

If organization memory is accepted into a repository, drift means mismatch with that accepted memory.

SpecForge does not decide whether Kafka, Okta, Datadog, or internal systems are good choices. It helps the repository remain consistent with the accepted organization standards.
