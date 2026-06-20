# Presets Test Plan

## P4 Tests

- Built-in presets validate.
- Invalid preset IDs are rejected.
- Unsafe destinations are rejected.
- Duplicate normalized destinations are rejected.
- Accepted decisions are rejected.
- Unknown keys are rejected.
- Registry listing is deterministic.
- Registry lookup works for known and missing IDs.

## Security Expectations

- Preset definitions are untrusted until validated.
- Preset destinations must pass safe relative path normalization.
- Preset decisions must remain proposed.
- Presets must not write files directly.
