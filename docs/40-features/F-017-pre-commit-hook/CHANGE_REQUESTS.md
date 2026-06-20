# Change Requests: Pre-Commit Hook Generation

## CR-1: Auto-detected gates must not break architecture neutrality

- Origin: design discussion.
- Request: the hook should also run the repository's tests, not just `recall doctor`.
- Conflict: hardcoding detected commands (for example `pnpm test`) in the hook would encode a
  toolchain choice as core truth, which the architecture-neutrality rule forbids.
- Resolution (accepted): detection seeds `preCommitGates` in `.recall/config.json` as proposed,
  editable values; the hook runs those configured gates. The toolchain choice lives in user config,
  not in core. Recorded in ADR-0002.

No other change requests are accepted. A `recall hooks sync` command and a Doctor check for
hook-versus-config drift are noted as future work, not part of this feature.
