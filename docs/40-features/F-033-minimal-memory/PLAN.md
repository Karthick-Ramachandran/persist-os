# Plan: Minimal-By-Default Memory

1. `required-files-check.ts`: six-doc set, dirs trimmed.
2. `generate-init.ts`: PRODUCT.md template, drop 9 templates, AGENTS/cursor/adrs-README
   reference fixes, preset plumbing + preset docs removed, READMEs to flag-gated export.
3. `generate-feature.ts` + `feature/create.ts`: 2/3-file scaffold, next-steps text.
4. `init.ts` + `main.ts`: `--preset` out, `--features`/`--modules` in.
5. `config-schema.ts` + `default-config.ts`: preset out with friendly rejection.
6. Delete `src/presets/`, `src/core/presets/`, `src/commands/preset/`, preset tests.
7. Five checks: input-absence outcomes (verdicts untouched); `retired-skills` check; wiring.
8. MIGRATION.md, README.md, repo `docs/ai/PERSIST_COMMANDS.md`, dogfood config.
9. Tests: golden, minimal/full doctor, scaffold, config, flags, per-check not-evaluated.
10. Module memory, REVIEW, COMPLETION_REPORT, evidence chain.
