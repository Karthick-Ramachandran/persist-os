# Plan: Init Reinit Guard

## Approach

Add a guard in `initProject` and a `--reinit` flag in the CLI. Keep it a read-only check before any
write.

## Steps

1. Add `reinit?: boolean` to `InitOptions` and `EXISTING_INSTALLATION` to `InitErrorCode`.
2. In `initProject`, before resolving the preset, refuse when `force && !reinit` and
   `.recall/config.json` exists.
3. Add `--reinit` to the CLI init command and pass it through.
4. Document `--reinit` in the command reference, generator template, and contribution guide.
5. Add integration tests for refuse and allow paths.

## Out Of Scope

- Interactive prompts.
- Detecting non-Recall content.
