# Architecture Impact: Aitools Output Selection

## Summary

Wires an existing config field to its intended behavior. No new ADR required — this is not a new
architecture decision, it is making `aiTools` honest.

## Touched

- `src/core/config/default-config.ts` — default `aiTools` includes `cursor` so default output is unchanged.
- `src/commands/init.ts` — `--ai-tools` option threading + a path-prefix filter on the generated files.
- `src/cli/main.ts` — the `--ai-tools` flag.

## Invariants preserved

- `AGENTS.md` stays foundational (always generated).
- Default behavior is byte-identical to the previous version.
- Additive and gated: a repo that does not pass `--ai-tools` is unaffected.
