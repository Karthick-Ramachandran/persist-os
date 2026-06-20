# Test Plan: Skill Generation

## Unit Tests

- `tests/unit/skills/skill-catalog.test.ts`: catalog ships the MVP set; every skill is valid per the
  Agent Skills format (name regex, description length, "Use when").
- `tests/unit/skills/generate-skill.test.ts`: emits to both targets with identical content; catalog
  vs skeleton; no fenced code blocks.

## Integration Tests

- `tests/integration/skill-command.test.ts`: `skill create` writes both targets; `skill list` lists
  the catalog; `--dry-run` writes nothing; existing skill is skipped unless `--force`.

## Dogfooding

- Regenerate the repository's own skills from the catalog and confirm Doctor still passes.

## Regression

- `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`,
  `pnpm pack:check`, `node dist/cli.js doctor`.
