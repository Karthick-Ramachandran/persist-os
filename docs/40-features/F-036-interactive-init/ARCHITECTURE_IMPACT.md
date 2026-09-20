# Architecture Impact: Interactive Init

Init gains a question layer in front of an unchanged write path. Answer resolution feeds the
existing options (tools, features, modules, detected test command); everything downstream — config,
file generation, summaries — runs as today. The prompt module is the only new file, kept small on
the standard library with injectable streams so it unit-tests without a terminal.

No CLI surface change beyond the additive `--yes` flag: existing flags keep exact behavior, and the
non-TTY fallback reproduces today's non-interactive defaults with an explanatory notice.

## Security Impact

Prompts read only short answers from stdin and never execute them; the test command shown in
question 4 is detected, not user input, and enabling the gate only records the command in config and
hooks. No new trust boundaries.
