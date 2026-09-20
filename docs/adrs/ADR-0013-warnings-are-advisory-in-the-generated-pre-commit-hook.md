# ADR-0013: Warnings Are Advisory in the Generated Pre-Commit Hook

## Status

Accepted

## Context

The generated pre-commit hook ([ADR-0002](ADR-0002-pre-commit-hook-generation.md)) is `set -e`
followed by `persist doctor`, and doctor exits 1 on warnings
([ADR-0011](ADR-0011-one-zero-stability-contract.md) freezes the 0/1/2 codes). So warnings already
block commits: there are two severity names for one outcome, and every "this is only a warning"
line in the ADRs is a promise the product does not keep.

The out-of-box experience is broken the same way. `persist init` writes templates, then the hook
it also wrote refuses the first commit because those templates are unfilled. That is not
discipline; it is the tool blocking the user from committing its own output.

This is also the premise [ADR-0010](ADR-0010-chestertons-fence.md) builds on. ADR-0010 chose warn
rather than block on the reasoning that a warning an agent acts on is worth more than a block a
human learns to bypass. That reasoning is currently false, so the decision below lands before the
fence is built.

## Decision

The generated pre-commit hook treats doctor warnings as advisory and errors as blocking. It runs
`persist doctor` with its output visible, then continues on exit 0 (pass) and exit 1 (warnings)
and fails only on exit 2 and above (errors):

```sh
set +e
persist doctor
status=$?
set -e
[ "$status" -le 1 ] || exit "$status"
```

The `set +e` / `set -e` pair is deliberate: under `set -e` the shell aborts before `$?` can be
read, so the inspection needs errexit off around exactly the doctor invocation. Doctor's output
is never redirected — warnings nobody can see are not advisory, they are invisible.

Doctor's exit codes do not change. ADR-0011 freezes 0/1/2 and explicitly excludes generated
content from the stability promise, so this ships as generated-content evolution, in a patch
release if needed.

There is deliberately no config knob for the old behaviour. This release deleted three unwired
settings; a `strictHooks` toggle would re-earn that mistake. One good default: teams who want
warnings to block add `persist doctor` to their own `preCommitGates`, where `set -e` gives them
exactly the old semantics.

## Alternatives Considered

- **Keep warnings blocking and revisit ADR-0010's severity instead.** Then "warns" and "blocks"
  are the same thing and the ADR's argument for choosing warn no longer applies. Rejected: it
  keeps the broken first-commit experience and concedes the bypass problem below.
- **A config knob (`strictHooks` or similar) choosing between the two.** Rejected. Unwired
  settings were just removed; one good default plus the `preCommitGates` escape hatch covers both
  audiences without a second code path.
- **Change doctor's exit codes instead of the hook.** Rejected. The codes are frozen by ADR-0011
  and depended on by scripts and CI; the hook is content and explicitly excluded.

## Consequences

**Improves.** The severity model means what it says: warnings advise, errors block. A fresh
`persist init` no longer refuses its own first commit over unfilled templates. ADR-0010's
warn-rather-than-block premise becomes true before the fence is built on it.

**Worsens.** A gate that blocks too readily gets bypassed wholesale, and this change accepts the
mirror risk: a team can now ignore warnings indefinitely with no friction. `--no-verify` is not
selective — the moment someone reaches for it over an unfilled template, they also disable the
error-level checks that actually matter. Advisory warnings keep the block available for the
things that deserve it, which is the better side of the trade.

**Risks.** The recorded blocked-commit transcripts on the site (landing page, hooks docs) show a
commit refused over warnings and are invalidated by this change. They are re-recorded in one pass
after the fence lands. Teams relying on warnings blocking commits (rather than on errors) will
see commits proceed where they previously stopped; the migration note names the `preCommitGates`
escape hatch.

## Related Documents

- Product: `docs/00-product/PRODUCT.md`
- Architecture: `docs/10-architecture/ARCHITECTURE.md`
- Related: [ADR-0002](ADR-0002-pre-commit-hook-generation.md),
  [ADR-0010](ADR-0010-chestertons-fence.md),
  [ADR-0011](ADR-0011-one-zero-stability-contract.md)
