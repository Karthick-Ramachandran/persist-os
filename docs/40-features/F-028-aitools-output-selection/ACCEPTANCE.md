# Acceptance Criteria: Aitools Output Selection

## Criteria

- Default `recall init` (no flag) generates the exact same file set as before — zero regression.
- `recall init --ai-tools claude` omits `.cursor/` and `.agents/` skills; keeps `AGENTS.md` and
  `.claude/*`.
- `recall init --ai-tools codex` omits `CLAUDE.md`/`.claude/` and `.cursor/`; keeps `AGENTS.md` and
  `.agents/skills`.
- `AGENTS.md` is always generated (CLAUDE.md imports it; Codex and Cursor auto-load it).
- An invalid tool value produces a clear error and exit code 1.
- All gates green and `recall doctor` PASSED on this repo.

## Out Of Scope

- Reconfiguring `aiTools` after init (re-run init with `--reinit --force`).
