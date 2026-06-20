# PRD: Guided Command Output

## Purpose

New users do not know what Recall OS creates or what to do with it. Commands listed created paths but
did not explain what each artifact is for or what to do next. This feature makes every create command
guide the user — like a framework scaffolder that tells you exactly which file it made, where it is,
and what to do with it.

## Problem

- Output was a bare list of created paths with no guidance.
- Users had to discover the purpose of each generated file themselves.
- The behavior was inconsistent to reason about across commands.

## In Scope

- Add a shared "Next steps" guidance block to command output.
- Apply it consistently to `init`, `adopt`, `feature create`, `adr create`, `module create`,
  `skill create`, and `mcp add`.
- Each block names the key file, where it is, and what to do next.
- Guidance is shown only for real writes, not dry runs.

## Non-Goals

- No interactive prompts (the CLI stays non-interactive; that would need a dependency and review).
- No change to what files are generated.

## Users

- New users learning what the tool produces.
- Returning users who want a reminder of the next action.

## Success Criteria

- Every create command prints a "Next steps" block naming the file and the action.
- Dry runs do not print next steps.
- The full test suite passes.
