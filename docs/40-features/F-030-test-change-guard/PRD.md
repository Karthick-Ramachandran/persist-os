# PRD: Test Change Guard

## Purpose

The team rule is "tests are mandatory for every change," but nothing enforces it — code can be
committed with no accompanying test. This feature adds `recall guard`: a deterministic check that
fails when staged source files change without any staged test changes. Add it to your gates
(`preCommitGates`) and the existing pre-commit / pre-push hooks enforce it.

## In Scope

- A `recall guard --source <dirs> [--base <ref>]` command.
- Reuse the existing cross-ecosystem test-file detection (Go, JS/TS, Python, JVM, PHP, Ruby), extracted
  to a shared `isTestFile`.
- Compare staged changes (`git diff --cached`) by default, or against a ref with `--base`.
- Exit 1 (block) when source changed without tests; exit 0 otherwise; skip gracefully (exit 0) when no
  `--source` is given or the directory is not a git repo.

## Non-Goals

- A config-schema field (configured via the gate command's args; opt-in, zero impact otherwise).
- Judging whether the test is good or actually covers the change (structural, not semantic — the agent
  and the `write-tests` skill own that).
- Auto-detecting source directories (kept explicit to stay architecture-neutral).
