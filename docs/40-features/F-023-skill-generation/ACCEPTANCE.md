# Acceptance Criteria: Skill Generation

## Command

- `recall skill create <name>` writes `<name>/SKILL.md` to both `.claude/skills/` and
  `.agents/skills/`, with identical content.
- `recall skill list` lists the catalog skills.
- `--dry-run` writes nothing; existing skills are skipped unless `--force`.
- An invalid skill name is rejected with a clear error.

## Format Validity

- Generated frontmatter has `name` matching `^[a-z0-9](-?[a-z0-9])*$`, at most 64 characters, and
  matching the directory.
- `description` is at most 1024 characters and contains "Use when" trigger language.
- Generated skills contain no fenced code blocks or scripts.

## Catalog

- The catalog ships the documented MVP skill set.
- Every catalog skill renders a valid `SKILL.md` with Purpose, Inputs, Required Reading, Output
  Files, Process, Stop Conditions, and Quality Bar.

## Dogfooding

- The repository's own skills can be regenerated from the catalog with `recall skill create`.

## Regression

- The full test suite passes and Doctor still passes.
