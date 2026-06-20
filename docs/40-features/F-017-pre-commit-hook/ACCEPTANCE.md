# Acceptance Criteria: Pre-Commit Hook Generation

Acceptance criteria are behavior-level and testable.

## Hook generation

- `recall init` creates `.recall/hooks/pre-commit`.
- The created hook file is executable (owner execute bit set).
- The hook content starts with a `#!/bin/sh` shebang.
- The hook runs `recall doctor`.
- The hook runs each command listed in `preCommitGates`, in order, after `recall doctor`.
- With no configured gates, the hook runs only `recall doctor`.

## Detection and config

- A new `preCommitGates` string array exists in `.recall/config.json` and defaults to empty.
- In a repository with a `package.json` `test` script and a `pnpm-lock.yaml`, detection seeds
  `preCommitGates` with `pnpm run test`.
- In a repository with a `package-lock.json`, detection uses `npm run <script>`.
- In a directory with no `package.json`, detection seeds an empty gate list.
- The config schema rejects a gate containing a newline or control character.

## Safety and neutrality

- `recall init` prints the activation command `git config core.hooksPath .recall/hooks` and does not
  execute it.
- A pre-existing `.recall/hooks/pre-commit` is skipped without `--force` and overwritten only with
  `--force`.
- The hook path resolves within the project root; writing is refused otherwise.
- No git configuration is modified by `recall init`.

## Regression safety

- Existing init output, golden file lists, and examples are updated to include the hook.
- The full test suite passes.
