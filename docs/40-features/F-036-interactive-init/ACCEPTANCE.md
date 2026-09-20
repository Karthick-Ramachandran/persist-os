# Acceptance: Interactive Init

1. `persist init` in a TTY asks four questions and writes what the answers imply.
2. `persist init --yes` prompts for nothing and takes every default.
3. `persist init --ai-tools codex --features` prompts for nothing.
4. `persist init` with stdin not a TTY prompts for nothing, behaves as `--yes`, and says so.
5. Question 4 shows the detected test command before asking, and defaults to no when nothing was
   detected.
6. Empty input at any prompt takes the default.
7. Invalid input re-asks rather than crashing or silently taking a default.
8. `--dry-run` still writes nothing, and still asks (or does not) exactly as above.
9. No new entry in `package.json` dependencies.
10. Every existing flag behaves exactly as it does on `main`.
11. `NO_COLOR=1`, piped stdout, and `TERM=dumb` emit zero escape codes; `FORCE_COLOR=1` emits color
    even piped.
12. Stripping color loses nothing: every message carries meaning in words.
13. Escape codes appear in exactly one module.
14. Init opens with the product masthead and marks progress on each question.
