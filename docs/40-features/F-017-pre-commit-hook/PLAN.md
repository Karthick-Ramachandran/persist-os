# Plan: Pre-Commit Hook Generation

## Approach

Add a small `hooks` concern, extend config and the safe writer, and wire generation into init. Keep
the toolchain choice in user config so core stays neutral.

## Steps

1. Add `preCommitGates: string[]` to the config schema (single-line, control-char-free entries) and
   default it to empty in the default config.
2. Add an `executable` flag through `WriteFileInput` and the create/overwrite write entries; have
   `writeFileSafe` set mode `0o755` for executable entries while keeping symlink and root-escape
   protection.
3. Add `src/core/hooks/detect-gates.ts` with `detectPreCommitGates(rootDir)`: read `package.json`
   scripts and a lockfile, return proposed `<pm> run <script>` commands for known scripts, or an
   empty list when no toolchain is detected.
4. Add `src/core/hooks/generate-hook.ts` with `renderPreCommitHook(gates)` and the hooks path
   constant, producing a `#!/bin/sh` script that runs `recall doctor` then each gate.
5. Wire init: detect gates, seed config, add the executable hook file to the write plan, and append
   the activation proposal to init output.

## Reuse

- Reuse existing safe-path, symlink, and conflict-policy protections in the write pipeline.
- Reuse the section/standards patterns only where helpful; hooks logic stays local to the concern.

## Out Of Scope

- A `recall hooks` subcommand.
- Doctor detection of hook-versus-config drift.
- Automatic git configuration.
