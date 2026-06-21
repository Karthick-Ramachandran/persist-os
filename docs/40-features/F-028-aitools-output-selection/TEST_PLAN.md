# Test Plan: Aitools Output Selection

## Unit Tests

- `createDefaultConfig` default `aiTools` is `["claude","codex","cursor"]`.
- The file filter keeps/drops `CLAUDE.md`/`.claude/`/`.cursor/`/`.agents/` correctly per tool set, and
  always keeps `AGENTS.md` and tool-agnostic files (docs, `.recall/`, `.github/`).

## Integration Tests

- Default init generates the full set (existing golden test stays green).
- `init --ai-tools claude` and `--ai-tools codex` narrow the output as specified.
- An invalid `--ai-tools` value exits non-zero with a clear message.

## Security Tests

- No new surface: still local, deterministic file writes; the safe-write pipeline is unchanged.
