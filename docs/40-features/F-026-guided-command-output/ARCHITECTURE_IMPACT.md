# Architecture Impact: Guided Command Output

## Affected Modules

- `cli`/commands: the format functions of the create commands gain a guidance block.

## New Behavior

- `appendNextSteps(lines, steps)` is added to `src/commands/write-summary.ts`.
- Each create command's `format*Result` calls it with command-specific guidance on non-dry-run.

## Decision Records

No new ADR is required. This is a presentation-only change within the existing CLI module.

## Security Impact

- None. Output formatting only; no new files, capabilities, network, or data are added.

## Compatibility

- Output gains extra lines; existing assertions check for content presence, not exact output.
- Dry-run output is unchanged.
