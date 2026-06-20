# Repository Init Test Plan

## P1.7 Docs Verification

- Confirm `specforge init` is documented as valid in empty folders.
- Confirm no existing app code or framework is required.
- Confirm Git is optional for init.
- Confirm presets remain optional opinion packs.
- Confirm no runtime init behavior changed in P1.7.

## Future Runtime Tests

When init is implemented, add tests for:

- Empty directory init.
- Non-Git directory init.
- Existing repository init.
- Existing files skipped by default.
- Preset guidance marked as proposed or optional.
- Technology detection does not create accepted decisions.
