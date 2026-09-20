# Changelog

## 1.0.0

First stable release. `persist` generates less, checks more honestly, and commits to an interface.

### The contract

1.0.0 promises **CLI surface and config-schema stability**
([ADR-0011](docs/adrs/ADR-0011-one-zero-stability-contract.md)). Command names, flags,
`.persist/config.json` fields and doctor's exit codes (`0` pass, `1` warnings, `2` errors) stay
compatible within 1.x. Generated document content keeps improving and is tracked by
`templateVersion`.

### Breaking

Both are named in [MIGRATION.md](docs/00-product/MIGRATION.md) with the exact edit each needs.

- **`preset` removed from config, and the preset system retired.** Ten presets,
  `persist preset list` and `--preset` are gone. An existing config carrying the field fails with a
  message naming the line to delete.
- **`persist guard` removed**, replaced by `persist test-gate`, which runs your tests and requires
  them to pass rather than checking that a test file was touched.

### Less ceremony

- Required documents drop from **14 to 6** plus `docs/adrs/`.
- `persist feature create` writes **2 files**, or 3 when a test command is configured — down from 9.
- Features and modules are opt-in.
- The skill catalog drops from **12 to 3**, all rewritten: `plan-feature`, `security-review`,
  `conventions-adherence`. `Required Reading` sections are gone, so a triggered skill costs its own
  body instead of eight documents.

### An honest gate

- Doctor reports **which checks it could not evaluate, and why**, instead of reporting `PASSED` for
  work it did not do. This closed two real holes: the staleness check silently evaluating nothing on
  a shallow CI clone, and checks whose input documents became optional.
- Hooks split by cost: doctor at commit (~1.7s), tests and type checks at push.
- New checks for hook drift and for retired skills left on disk.

### Other

- `persist init` is interactive, with `--yes` and non-TTY detection for CI.
- Generated skills may ship read-only scripts
  ([ADR-0012](docs/adrs/ADR-0012-generated-skills-may-ship-scripts.md)).
- `persist adopt` reads runtime dependencies only, so a library that tests against a framework no
  longer gets that framework proposed as a decision.
- The published package ships 9 files instead of 271.

### Known

- **Warnings block commits.** The generated pre-commit hook runs `persist doctor` under `set -e`,
  and doctor exits 1 on warnings, so a repository cannot commit until template sections are filled.
  The hook is generated content rather than frozen interface, so this can change in a patch release.
- **Chesterton's fence is not in 1.0.** ADR-0010 remains Proposed; see
  [PLAN-1.0.md](docs/00-product/PLAN-1.0.md) phase 7. Planned for 1.1.
- `persist adopt` still reads dev-only packages as signals in Cargo, Composer, Gemfile and
  requirements files. Every signal is proposed rather than accepted.
