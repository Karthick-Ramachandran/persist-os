# Plan: Interactive Init

1. New `src/cli/prompt.ts`: `askYesNo`, `askAiTools`, `askTestGate` on `node:readline/promises`,
   taking injectable input/output streams; empty input takes the default, invalid input re-asks.
2. `init.ts`: resolve interactivity (explicit flags or `--yes` win; else TTY prompts; non-TTY
   behaves as `--yes` with a notice), ask the four questions with detected values as defaults, then
   run the unchanged write path.
3. `main.ts`: register `--yes`, pass stdin TTY state through.
4. Generated docs + README quickstart mention the interactive flow.
5. Tests: prompt unit tests with fake streams; integration for the three non-interactive paths;
   piped-stdin child-process test with timeout; config-matches-answers test.
6. Module memory, completion report, evidence chain incl. piped dry-run.
