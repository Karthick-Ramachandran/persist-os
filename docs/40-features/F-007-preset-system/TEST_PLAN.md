# Test Plan: Preset System

## Unit Tests

- All built-in presets validate.
- Invalid preset IDs are rejected.
- Unsafe template destinations are rejected.
- Unsafe proposed-decision destinations are rejected.
- Duplicate normalized destinations are rejected.
- Unknown keys are rejected.
- Accepted decisions are rejected.
- Registry lists presets deterministically.
- Registry lookup works by ID.
- Missing registry lookup returns `undefined`.

## Security Tests

- Preset destinations cannot use traversal.
- Preset destinations cannot use absolute paths.
- Preset destinations cannot use backslashes.
- Preset destinations cannot contain null bytes or empty segments.
- Preset definitions cannot mark decisions as accepted.

## Verification

Run:

```txt
pnpm test:run
pnpm typecheck
```

## Out Of Scope

- CLI integration tests.
- Golden generated output tests.
- File write tests.
- Rich framework template tests.

Those belong to later init and generation milestones.
