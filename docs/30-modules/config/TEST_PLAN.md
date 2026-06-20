# Config Test Plan

## P2 Tests

- Default config validates.
- Invalid config is rejected.
- Invalid JSON fails load.
- Missing config fails load clearly.
- Unsafe config paths are rejected.
- Unknown config keys are rejected.
- Decision index keys are rejected in P2.
- Organization standards key is rejected in P2.
- Config writing uses safe write policy.
- Existing config is skipped by default.
- Dry run writes nothing.
- Force overwrite works explicitly.

## Security Expectations

- Config must not store secrets.
- Config must not allow arbitrary secret-like keys through strict schema.
- Config write paths must not bypass `core/filesystem`.
