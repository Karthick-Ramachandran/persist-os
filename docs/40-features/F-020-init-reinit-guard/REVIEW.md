# Review: Init Reinit Guard

## Status

Passed.

## Scope Review

- One guard in `initProject`, one CLI flag, and documentation. No other behavior changed.

## Correctness Review

- The guard triggers only when `force` is set, `reinit` is not, and `.recall/config.json` exists.
- The refusal writes nothing and names `--reinit`.
- `--reinit` allows the overwrite; fresh-directory `--force` is unchanged.

## Security Review

- Strengthens the non-destructive write policy. The check is a read-only `existsSync` before writes.

## Dogfooding Review

### Did the workflow catch any issue?

This feature exists because the workflow's committed memory let an accidental `init --force` in the
repository root be detected and fully recovered. The guard now prevents that accident at the source.

### What should Recall OS improve before public release?

Consider a similar guard for any future command that can overwrite memory in bulk, and a global
`--yes` style confirmation convention.
