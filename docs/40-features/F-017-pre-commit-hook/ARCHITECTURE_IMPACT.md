# Architecture Impact: Pre-Commit Hook Generation

## Affected Modules

- `config`: adds the `preCommitGates` field and its validation.
- `filesystem`: adds the ability to write an executable file safely within the project root.
- `hooks` (new): detects proposed gates and renders the pre-commit hook content.
- `repository-init`: seeds gates, adds the hook to the init write plan, and prints the activation
  proposal.

## New Behavior

- `preCommitGates: string[]` is added to the config schema, defaulting to empty, with each entry
  validated as a single-line, control-character-free string.
- `writeFileSafe` honors an `executable` flag and sets mode `0o755` on the written file, still
  refusing symlinked paths and writes outside the project root.
- A new `src/core/hooks/` concern provides `detectPreCommitGates(rootDir)` and
  `renderPreCommitHook(gates)`.
- `recall init` runs detection, seeds config, writes `.recall/hooks/pre-commit` as executable, and
  appends the activation proposal to its output.

## Decision Records

- Governed by ADR-0002 (Pre-Commit Hook Generation), which is accepted.

## Security Impact

- The hook is executable and runs on every developer machine on every commit. This is a deliberate,
  security-sensitive capability and is recorded in ADR-0002 and the security model.
- Recall OS gains the ability to write an executable file. The capability is constrained to the
  configured hooks path within the project root and reuses the existing symlink and path-traversal
  protections.
- `preCommitGates` values are executed by the hook as written. They are user-authored and trusted at
  the same level as `package.json` scripts. The config schema rejects multi-line and control
  characters to reduce accidental command injection through edited config.
- `recall init` does not run `git config` or any git mutation. Activation is an explicit human step,
  so the tool never changes git behavior on its own.
- Detection only reads `package.json` and lockfiles; it does not execute repository content.
- Worst-case failure mode is a hook that runs a user-authored command, not data loss or escape from
  the project root.

## Compatibility

- Repositories initialized before this feature gain the hook only when they re-run `recall init`.
- Generated init output, golden file lists, and committed examples grow by one hook file.
