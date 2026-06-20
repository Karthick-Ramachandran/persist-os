# Repository Init Test Plan

## P1.7 Docs Verification

- Confirm `specforge init` is documented as valid in empty folders.
- Confirm no existing app code or framework is required.
- Confirm Git is optional for init.
- Confirm presets remain optional opinion packs.
- Confirm no runtime init behavior changed in P1.7.

## P5 Runtime Tests

- Done: Empty directory init.
- Done: Non-Git directory init.
- Done: Existing repository init.
- Done: Existing files skipped by default.
- Done: Preset guidance marked as proposed or optional.
- Deferred: Technology detection does not create accepted decisions.

## P9 Runtime Tests

- Done: Init generates `docs/ai/SPECFORGE_COMMANDS.md`.
- Done: Command reference lists current commands and Doctor.
- Done: Init golden tests include command-reference and index docs.
