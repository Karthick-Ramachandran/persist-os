# Test Plan: Interactive Init

- Prompt unit tests drive the prompt module with a fake input stream: defaults on empty input,
  re-ask on invalid input, each answer parsed (yes/no variants, tool list parsing, test-gate
  accept/decline).
- Integration per non-interactive path: `--yes` prompts nothing and takes defaults; explicit flags
  prompt nothing; non-TTY stdin prompts nothing, behaves as `--yes`, and says so.
- Piped empty stdin against the built CLI completes rather than hanging, with a timeout so a
  regression fails the suite instead of wedging CI.
- Generated config matches the answers given (tools, features/modules flags flow into config and
  generated files).
- No test requires a real TTY.
- Full suite green; existing flag behavior unchanged (existing init tests).
