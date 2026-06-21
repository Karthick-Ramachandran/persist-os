# PRD: Aitools Output Selection

## Purpose

`aiTools` is stored in `.recall/config.json` but read by no code — `recall init` always generates the
Claude files, the Cursor rule, and the portable Agent Skills regardless. This makes the config
dishonest (a knob that does nothing) and clutters repos with files for tools the team does not use.
This feature makes `aiTools` actually select which AI-tool files `init` writes, and exposes a
`--ai-tools` flag, so a team only gets the files for the tools they use.

## In Scope

- Filter the generated tool-specific files (`CLAUDE.md` + `.claude/`, `.cursor/`, `.agents/`) by
  `config.aiTools`.
- Add `recall init --ai-tools <comma-list>` to set it at init time.
- Set the default to `claude,codex,cursor` so existing output is byte-identical when no flag is given.
- Document the field and its options (README + generated RECALL_COMMANDS.md).

## Non-Goals

- Wiring `memoryProfile`/`mode`/`writePolicy` (separate, later tasks).
- Changing skill content or adding per-tool skill formats.
- Any network, telemetry, or runtime behavior.
