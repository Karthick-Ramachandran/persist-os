# Review: Pre-Commit Hook Generation

## Status

Passed.

## Scope Review

- Adds a `hooks` concern, a `preCommitGates` config field, executable-file write support, and init
  wiring. Scope matches the PRD and ADR-0002.
- No `git config` mutation, no `.git/hooks` writes, no hardcoded toolchain, no network.

## Correctness Review

- The hook is executable, starts with a shebang, runs `recall doctor`, then configured gates.
- Detection is neutral: proposes gates only from `package.json` scripts and the lockfile, empty
  otherwise.
- Generation is non-destructive: an existing hook is skipped unless `--force`.

## Security Review

- Executable write is constrained to the configured path inside the project root and reuses symlink
  and traversal protection.
- `preCommitGates` reject multi-line and control characters; values are user-authored and trusted
  like `package.json` scripts, as recorded in ADR-0002 and the architecture impact.
- Activation remains a deliberate human step.

## Dogfooding Review

### Did Recall OS-generated docs help implementation?

Yes. The ADR workflow forced the neutrality conflict (auto-detected gates) to be resolved as
proposed config rather than hardcoded core, before any code was written.

### Did the workflow catch any issue?

Yes, two.

- The architecture-neutrality rule blocked hardcoding `pnpm test` into the hook. The resolution was
  to seed proposed `preCommitGates` in config instead.
- During example regeneration, an `init --force` was accidentally run in the repository root and
  overwrote curated memory files (CLAUDE.md, AGENTS.md, and several docs). Because all memory is
  committed, the damage was detected immediately and fully restored with `git checkout`, and the
  preset junk was removed. No curated content was lost. This reinforces the project's own thesis:
  committed repository memory makes mistakes recoverable.

### What should Recall OS improve before public release?

Consider warning when `recall init` runs in a non-empty repository root, and add a `recall hooks
sync` command plus a Doctor check for hook-versus-config drift.
