# AI Agent Rules

AI agents must follow repository memory over model preference.

If a request conflicts with accepted repository memory or engineering standards, stop and report the
conflict.

## Changing an accepted decision

When work would change something an accepted ADR governs:

1. Find the accepted ADR in `docs/adrs/` that covers it.
2. If the change contradicts it, stop and confirm with a human before changing the code.
3. Record the new decision with `recall adr supersede <old> <new-title>` so the old ADR is marked
   superseded and the reasoning is preserved, instead of silently editing or contradicting it.
