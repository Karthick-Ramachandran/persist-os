# Test Plan: Skills v2

- Catalog: exact three names; Agent Skills frontmatter validity; description
  carries WHAT/WHEN (`Use when` retained as the trigger convention); no
  `Required Reading` in any rendered skill; word ceiling 600 per rendered
  skill; Verification and Output present on all three; sparse definition omits
  unearned headings; workflow steps 5–10.
- Trigger routing per skill: must-activate prompts share a trigger term with
  the description; must-not prompts share none; each description contains none
  of the other skills' trigger terms (cross-exclusion).
- Scripts: secret-scan content carries no network tokens and no write
  operators; SKILL.md states the prose fallback and works with scripts/
  deleted; generated script files are executable through the pipeline;
  init output names executable files written.
- Retired-skills: warns naming the nine retired ids with removal commands;
  quiet on the three survivors and on absent dirs.
- Regression updates: golden minimal file list (3 skills plus one script per
  target), skill-command (surviving skill), guided-output, doctor-command JSON
  info counts if the finding mix changes, mcp-command unchanged (skeleton
  keeps the skill name).
- Full suite green; own doctor zero errors.
