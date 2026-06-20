# Privacy

## MVP Privacy Promise

SpecForge MVP does not collect, transmit, or store user analytics.

It must not:

- Send repository contents to remote services.
- Send usage events.
- Require accounts.
- Require API keys.
- Read `.env` files.
- Collect secrets.
- Run hidden background services.

## Local Files

SpecForge writes generated docs and config into the current repository only.

Future implementation must clearly report every created, skipped, or conflicted file.

## Future Changes

Telemetry, remote registries, cloud features, and AI API usage are explicit non-goals for MVP.

Any future privacy-affecting feature requires:

- RFC before implementation.
- ADR before acceptance.
- Clear opt-in design.
- Security review.
- Documentation update.
