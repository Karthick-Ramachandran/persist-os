# Acceptance Criteria: Init Reinit Guard

- Given a directory with `.recall/config.json`, `recall init --force` exits non-zero, writes
  nothing, and prints a refusal that mentions `--reinit`.
- Given the same directory, `recall init --force --reinit` succeeds and overwrites generated files.
- Given a directory without `.recall/config.json`, `recall init --force` overwrites as before.
- `recall init` without `--force` is unchanged and still skips existing files.
- `--dry-run` plus `--force` without `--reinit` is also refused when an installation exists, so a
  preview cannot imply a destructive run is allowed.
- The `--reinit` flag is documented in the command reference and contribution guide.
