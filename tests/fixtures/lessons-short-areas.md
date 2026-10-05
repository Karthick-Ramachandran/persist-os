# Lessons

Durable, hard-won lessons for this repository, so agents and humans do not repeat the same mistakes.
Keep each entry short: what happened, why, and what to do instead.
<!-- One bullet each in Review studio, QC media checks and Craft engine is excerpted verbatim from the foreign 8-area corpus measured for this work (the bullet its table prompt matches); every other line is written for this fixture. Do not expand the excerpt. -->

## Always

- Never commit secrets or credentials; read them from the environment at runtime.

## Review studio

Applies To: `apps/studio/**`

- Playwright `check()`/`uncheck()` throw "did not change its state" on a controlled checkbox whose value only flips when the saved view returns; `click()` then wait for the rendered chip (`e2e-g2.test.ts`).
- A hash-only navigation to the already-open URL does not refetch; reload the page after changing the workspace or tests assert stale state.

## QC media checks

Applies To: `packages/qc/src/checks/loudness.ts`, `packages/qc/src/ffmpeg.ts`

- `ebur128` prints its `Summary:` on stderr only at `-loglevel info`; `metadata=print:file=-` writes to stdout. Keep the two passes' log levels separate or the loudness parse fails on an empty summary.
- Limited-range averages mislead the flash delta; convert to full-range gray first.

## Craft engine

Applies To: `packages/craft/**`, `packages/storyboard/src/revise.ts`

- A revise fix must never make the cut worse: re-lint and re-run the hard plan check after applying, and revert the whole loop when either fails (`visual.ts`); a fix's prose is never executed, only its rule + scene (`revise.test.ts`).
- Caption words can arrive out of order; sort them before matching a multi-word name.

## Billing

Applies To: `src/billing/**`

- Prorated upgrades bill the remaining days on the new plan, never the full month twice.
- Refunds post to the original payment method; check the ledger before reissuing.
- Dunning retries a failed charge three times before suspending the account.

## Search index

Applies To: `src/search/**`

- Rebuild the index from the primary store after a schema change, never from a replica.
- Stale entries linger when deletes skip the queue; run a nightly reconciliation.

## Email delivery

Applies To: `src/email/**`

- Bounces suppress future sends to the address until it is re-verified.
- New templates need a plain-text part or spam filters flag the message.
- Test every template with seeded data before release.

## Feature flags

Applies To: `src/flags/**`

- A flag that is on for everyone is a constant; remove it instead of documenting it.
- Check flag evaluations in tests, never in production traffic.

## Backups

Applies To: `infra/backups/**`

- Restore drills run monthly against a scratch account, never the live one.
- Keep one encrypted copy off-site; test the decrypt path each quarter.
