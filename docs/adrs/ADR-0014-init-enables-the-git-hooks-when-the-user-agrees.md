# ADR-0014: Init Enables The Git Hooks When The User Agrees

## Status

Accepted

## Supersedes

- ADR-0002-pre-commit-hook-generation

## Context

ADR-0002 generated tracked hooks and had `persist init` print the activation command
(`git config core.hooksPath .persist/hooks`) without running it, because init "must not mutate git
configuration silently."

In practice the printed command was the step people skipped. A rehearsal of the product demo lost
both the Chesterton fence question and the pre-push test gate because the command was never run
after a fresh clone, and nothing said so. Every developer and every clone needs the step, since git
never activates hooks that arrive with a clone. It is a security property that no tool can remove.

ADR-0002 rejected a *silent* change. A question the user answers is not silent.

## Decision

Everything in ADR-0002 still holds except activation:

- `persist init` generates tracked hooks under `.persist/hooks/` (pre-commit runs `persist doctor`
  then `preCommitGates`; pre-push runs `persist test-gate` then `prePushGates`), never into
  `.git/hooks`, and never overwrites an existing hook without `--force`.
- Gates live in `.persist/config.json` as reviewable, user-authored values.

Activation changes:

- Interactive `init` asks "Turn on the git hooks in this clone?", defaulting to yes. On yes, init
  runs `git config core.hooksPath .persist/hooks` and says it did.
- `--yes` and non-interactive runs take that default, like every other question. `--no-enable-hooks`
  opts out and prints the command instead.
- Init never replaces a `core.hooksPath` that points somewhere else (another hooks tool such as
  Husky). It leaves it and says why. Outside a git repository, and under `--dry-run`, it changes
  nothing.
- A doctor check, `hooks-active`, warns in any clone where the hooks are not switched on and prints
  the command. It reports not-evaluated outside git and when the `CI` environment variable is set,
  because hooks are a per-clone setting for developer machines and a CI checkout never has them.

## Alternatives Considered

- **Keep printing the command (ADR-0002).** Rejected: the step was skipped, and the gates it guards
  then never ran with no signal.
- **Activate from a `package.json` `prepare` script.** Rejected as a default: it writes into a file
  Persist does not own and only exists for JavaScript projects. Teams can still add it themselves.
- **Doctor warning only, no init change.** Rejected: the person running init is the one moment we can
  ask; the warning alone would still fire on the first run of every new repository.

## Consequences

- The person who runs init answers one question, and the hooks work from the first commit.
- Teammates on other clones are told on their first `persist doctor` run, and an agent that sees the
  warning can run the command itself.
- Init now changes local git configuration by default. It is one key, local to the clone, never
  committed, reported in init's output, and never replaces another tool's value. `--no-enable-hooks`
  keeps the old behavior for scripted setups.
- CI runs are unaffected: the doctor check reports not-evaluated there instead of a warning that
  would fail the generated workflow.

## Related Documents

- PRD: `docs/00-product/PRODUCT.md`
- Architecture: `docs/10-architecture/FILE_WRITE_POLICY.md`
- Security: `docs/20-security/SECURITY_MODEL.md`
- Feature:
