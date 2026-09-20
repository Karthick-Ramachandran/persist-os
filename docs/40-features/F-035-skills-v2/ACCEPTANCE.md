# Acceptance: Skills v2

1. `persist skill list` shows exactly three skills.
2. Each generated `SKILL.md` has a filled description carrying WHAT and WHEN,
   and no `## Required Reading` anywhere in the catalog.
3. No skill exceeds 600 words.
4. Every skill has `## Verification` and `## Output`.
5. A skill with no content for a section does not get that heading.
6. `persist init` names any executable file it wrote.
7. A skill works with its `scripts/` directory deleted.
8. The retired-skills check warns on a repo carrying the nine retired skills
   and is quiet otherwise.
9. The scriptless-skills ADR is Superseded and the scriptless line is gone from both root files.
10. This repository's `persist doctor` still reports zero errors.
