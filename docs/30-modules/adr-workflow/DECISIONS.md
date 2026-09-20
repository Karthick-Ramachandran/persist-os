# ADR Workflow Decisions

## P7: ADRs Start Proposed

P7 creates ADR drafts with status `Proposed`.

Accepting an ADR remains a human-owned repository memory update.

## P7: ADR Create Is Idempotent By Slug

Rerunning `adr create <title>` for an existing valid ADR slug should not allocate duplicate decision
memory.

The existing file is reused, and the filesystem write policy determines whether it is skipped or
explicitly overwritten.

## F-037: Fence Reminder on Create and Supersede

`adr create` and `adr supersede` append a Chesterton-fence reminder to their next steps when the
fence is enabled — the zero-cost trigger that fires before the change, since both commands run
while the past reasoning is being revisited. The reminder is output text only; nothing is read,
written, or decided.
