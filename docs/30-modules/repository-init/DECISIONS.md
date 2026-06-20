# Repository Init Decisions

## P1.7: Empty-Folder Init Is First-Class

`specforge init` must work in an empty folder.

SpecForge does not require an app framework before initializing repository memory.

## P1.7: Git Is Optional

A Git repository is recommended for normal development, but it must not be required for init.

## P1.7: Init Does Not Generate App Code

`specforge init` creates repository memory only.

It must not generate Flutter, Next.js, Swift, Android, backend, or other production application code.

## P5: Parser Now, Bin Later

P5 implements testable CLI parser wiring for `init`.

Package `bin`, build, and release wiring remain P10 scope.

## P5: Minimal Useful Skeleton

P5 generates a concise neutral memory skeleton, not the full SpecForge dogfood tree.

## P9: Init Includes AI Command Memory

Init generates `docs/ai/SPECFORGE_COMMANDS.md` locally.

This file helps agents and humans understand available SpecForge commands without network access.
