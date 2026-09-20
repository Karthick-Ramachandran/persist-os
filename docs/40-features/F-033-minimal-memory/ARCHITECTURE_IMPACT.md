# Architecture Impact: Minimal-By-Default Memory

## Generator (`generator`)

- `neutralTemplates` loses 9 entries (PRD, BRD, ARCHITECTURE, MEMORY_ENGINE, FILE_WRITE_POLICY,
  THREAT_MODEL, TESTING_STRATEGY, AI_AGENT_RULES, 3× ai/\*) and gains `PRODUCT.md`. AGENTS.md +
  cursor-rule templates route only at the six required docs and drop the `PERSIST_COMMANDS.md`
  pointer; `adrs/README.md` drops the presets sentence.
- Features/modules READMEs leave `neutralTemplates` for flag-gated generation.
- Preset plumbing (`Preset` import, option, `generatePresetFiles`) deleted.
- `generate-feature.ts`: PLAN (with Acceptance Criteria section) + TASKS (with completion evidence
  sections); TEST_PLAN included only when the caller passes the gate flag. The generator takes the
  decision; `feature/create.ts` reads `config.testCommand`.
- Next-steps text in `feature/create.ts` updated to the new scaffold.

## Config (`config`)

- `preset` field + `presetSchema` deleted. `parseConfig` pre-checks for a `preset` key and throws
  naming it and the fix (delete the line) — zod's generic unrecognized-key error would not name the
  edit. Only breaking change in the module.

## CLI + init (`cli`, `repository-init`)

- `--preset` flag, `UNKNOWN_PRESET`, `InitResult.preset`, `Preset:` line deleted.
- `persist preset list` command deleted with `src/commands/preset/`.
- New `--features` / `--modules` flags generate the workflow READMEs.

## Doctor (`doctor`)

- `requiredDocs` becomes the six; `configured-directories` keeps docsDir + adrDir.
- Five checks gain detailed `{findings, outcome}` returns for input-absence only; verdict logic
  untouched. `runDoctor` records their outcomes; gated list gains `retired-skills`.
- New `retired-skills` check: on-disk non-catalog skills warn with removal commands.

## Deletions

- The preset source trees (ten packs plus registry, schema, and validation), the preset list
  command, 7 golden preset tests, 3 preset unit files, and the preset list integration test. Preset
  mentions in init/doctor/adr-accept tests updated. Historical feature memory left as record.
