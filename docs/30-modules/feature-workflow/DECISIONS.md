# Feature Workflow Decisions

## P6: Structure Before Substance

P6 creates feature memory structure.

It does not attempt to write complete feature PRDs or implementation plans automatically.

## P6: Feature Work Is Evidence-Based

Every generated feature includes review and completion report files so future work can record evidence before claiming done.

## P6: Feature Create Is Idempotent By Slug

Rerunning `feature create <name>` for an existing valid feature slug should not allocate duplicate feature memory.

The existing folder is reused, and the filesystem write policy determines whether files are skipped or explicitly overwritten.
