# Architecture Impact: Chesterton's Fence

- `core/doctor` gains a `fence` check module (read-only, like all checks): shells to git for the
  staged list (precedent: staleness check), reads `FENCES.md` and ADR files. Joins
  `CONFIG_GATED_CHECKS`; needs `fenceEnabled` on `DoctorCheckContext`.
- `core/config` gains optional `fenceEnabled` (default true, zod default so old configs load).
  ADR-0011 allows new optional fields.
- `core/hooks` SessionStart template gains the budget-capped index block. Pre-commit template
  already changed under ADR-0013; pre-push untouched.
- `core/skills` catalog goes 3 → 4. `persist skill list` follows automatically.
- `commands/init` asks a fifth question; `commands/adr` create/supersede append one next-step line
  when enabled. No new commands, flags, or exit codes (ADR-0011 surface stable).
- Module boundaries hold: commands orchestrate, core decides; doctor never mutates.
