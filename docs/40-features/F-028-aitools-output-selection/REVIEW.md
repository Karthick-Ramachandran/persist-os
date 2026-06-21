# Review: Aitools Output Selection

## Status

Reviewed.

## Notes

- Change is additive and opt-in; default output is byte-identical (verified by the existing golden
  test plus a dedicated zero-regression test).
- `validateAiTools` is an assertion function, so invalid values fail fast with a clear message and
  exit 1.
- `AGENTS.md` is correctly kept as the always-on portable floor.
