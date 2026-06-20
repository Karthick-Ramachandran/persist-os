# Architecture Impact: Init Reinit Guard

## Affected Modules

- `repository-init`: `initProject` gains a guard; the CLI init command gains a `--reinit` flag.

No other module changes.

## New Behavior

- `InitOptions` gains `reinit?: boolean`.
- `InitError` gains the `EXISTING_INSTALLATION` code.
- `initProject` refuses when `force` is set, `reinit` is not, and `.recall/config.json` exists.
- The CLI exposes `--reinit`.

## Decision Records

No new ADR is required. This strengthens the existing non-destructive file-write policy
(`docs/10-architecture/FILE_WRITE_POLICY.md`) rather than changing it.

## Security Impact

- Reduces the risk of destroying repository memory through an accidental `--force`.
- No new capability, network, dependency, or write surface. The check is a read-only `existsSync`
  before any write.

## Compatibility

- `init --force` in fresh directories is unchanged.
- Regenerating an existing installation now requires `--force --reinit`; the contribution guide and
  command reference are updated accordingly.
