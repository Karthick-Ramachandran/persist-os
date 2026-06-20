# PRD: Init Reinit Guard

## Purpose

`recall init --force` overwrites existing files. When run in a directory that already contains a
Recall OS installation, it silently overwrites curated repository memory. This actually happened
during development: an accidental `init --force` in the repository root overwrote `CLAUDE.md`,
`AGENTS.md`, and several docs (recovered from git).

This feature makes that destructive case require explicit intent.

## Problem

- `init --force` does not distinguish a fresh directory from an existing Recall OS installation.
- Overwriting an existing installation destroys repository memory, the product's core asset.

## In Scope

- Refuse `init --force` when an existing `.recall/config.json` is present.
- Add a `--reinit` flag that, together with `--force`, allows overwriting an existing installation.
- Document the flag in the command reference and contribution guide.

## Non-Goals

- No change to `init` without `--force` (it already skips existing files safely).
- No interactive prompts; the CLI stays non-interactive.
- No detection of non-Recall files; `init` still works in existing app folders.

## Users

- Maintainers and contributors regenerating or upgrading repository memory.
- Anyone who runs `init --force` in the wrong directory.

## Success Criteria

- `init --force` in a directory with `.recall/config.json` refuses and writes nothing.
- The refusal message names `--reinit` as the way to proceed.
- `init --force --reinit` overwrites an existing installation.
- `init --force` in a directory without `.recall/config.json` still overwrites as before.
