# Repository Init Decisions

## P1.7: Empty-Folder Init Is First-Class

`specforge init` must work in an empty folder.

SpecForge does not require an app framework before initializing repository memory.

## P1.7: Git Is Optional

A Git repository is recommended for normal development, but it must not be required for init.

## P1.7: Init Does Not Generate App Code

`specforge init` creates repository memory only.

It must not generate Flutter, Next.js, Swift, Android, backend, or other production application code.
