# Repository Init Decisions

## P1.7: Empty-Folder Init Is First-Class

`persist init` must work in an empty folder.

Persist OS does not require an app framework before initializing repository memory.

## P1.7: Git Is Optional

A Git repository is recommended for normal development, but it must not be required for init.

## P1.7: Init Does Not Generate App Code

`persist init` creates repository memory only.

It must not generate Flutter, Next.js, Swift, Android, backend, or other production application
code.

## P5: Parser Now, Bin Later

P5 implements testable CLI parser wiring for `init`.

Package `bin`, build, and release wiring remain P10 scope.

## P5: Minimal Useful Skeleton

P5 generates a concise neutral memory skeleton, not the full Persist OS dogfood tree.

## P9: Init Includes AI Command Memory

Init generates `docs/ai/PERSIST_COMMANDS.md` locally.

This file helps agents and humans understand available Persist OS commands without network access.

## P10: Persist OS Init Output

Init output uses Persist OS naming and `.persist/config.json`.

No compatibility output is generated for the pre-public name.

## F-036: Init Asks Four Questions, Never Hangs

Bare `persist init` on a TTY asks AI tools, features, modules, and test gate (the detected command
printed before asking, defaulting to no when nothing was detected); any flag or `--yes` is a
complete non-interactive instruction. Non-TTY stdin behaves as `--yes` and says so, so CI can never
block on a prompt. Prompts live in `src/cli/prompt.ts` on `node:readline/promises` with injectable
streams; no new dependencies, no TUI.

## F-037: Init Asks a Fifth Question

The Chesterton fence question ("Enable the Chesterton fence?") comes after the test gate, making
five; progress tags move from `[n/4]` to `[n/5]`. `--yes` and non-TTY default it to on and the
closing output states the choice, like the test gate. With the fence off, init writes only the
`fenceEnabled: false` toggle — never `FENCES.md`.
