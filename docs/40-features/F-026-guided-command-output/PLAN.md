# Plan: Guided Command Output

## Steps

1. Add `appendNextSteps` to `src/commands/write-summary.ts`.
2. Call it from each create command's format function with command-specific guidance, gated on
   non-dry-run.
3. Add an integration test asserting guidance appears for each command and not on dry run.

## Out Of Scope

- Interactive prompts.
- Changing generated files.
