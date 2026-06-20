# Skills Test Plan

## Unit Tests

- The catalog ships the MVP set and every skill is valid per the Agent Skills format.
- Generation emits identical content to both targets and skeletons for unknown names.
- Generated skills contain no fenced code blocks or scripts.

## Integration Tests

- `recall skill create` writes both targets; `recall skill list` lists the catalog.
- `--dry-run` writes nothing; existing skills are skipped unless `--force`.

## Results

- Covered by `tests/unit/skills/*` and `tests/integration/skill-command.test.ts`.
