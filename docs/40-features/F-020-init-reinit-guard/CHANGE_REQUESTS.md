# Change Requests: Init Reinit Guard

No accepted change requests.

The refuse-by-default behavior was chosen over a non-blocking warning because the CLI is
non-interactive: a warning would not stop an overwrite, only an explicit `--reinit` does.
