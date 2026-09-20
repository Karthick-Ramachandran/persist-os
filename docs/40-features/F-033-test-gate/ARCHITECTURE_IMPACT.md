# Architecture Impact: Test Gate Module

## Config (`config` module)

- `persistConfigSchema` gains `testCommand` (single-line, ≤200 chars, no control characters,
  `nullable`, `default(null)`) and `prePushGates` (same shape as `preCommitGates`, `default([])`).
  Zod defaults keep old configs loading — no breaking change here.
- `createDefaultConfig` writes both. `Partial<PersistConfig>` overrides flow into `init` unchanged.

## Hooks (`hooks` module)

- `detect-gates.ts` gains `detectTestCommand()` (one-shot preference, watch-runner rejection, null
  when unsafe) and `detectPrePushGates()` (test command + typecheck + lint). Package-manager
  detection is shared, not duplicated. `detectPreCommitGates` is kept (tested, harmless).
- `generate-hook.ts`: `renderPreCommitHook(preCommitGates)` unchanged in shape;
  `renderPrePushHook(testCommand, prePushGates)` drops `persist doctor` (per ADR-0009's rejected
  alternative) and always emits `persist test-gate` first. Signature change is internal — both
  renderers are only called from `init`.

## CLI (`cli` module)

- `guard` registration removed; `test-gate` registered, mirroring the child exit code through the
  existing `state.exitCode` pattern. No new dependencies; execution via `execFile` (no shell).

## Doctor (`doctor` module)

- New `hook-drift` check: regenerates both hooks from config in memory and diffs against the tracked
  files. Warning on mismatch with the regeneration command; not-evaluated when either hook is
  absent.
- `DoctorCheckContext.config` gains `testCommand`, `preCommitGates`, `prePushGates` (pass-through;
  no other check reads them).
- Check-outcome reporting is added here (see PRD): `DoctorReport.checks`, NOT EVALUATED text
  section, JSON `checks` array. Exit codes, severities, `schemaVersion` unchanged.

## Generator (`generator` module)

- `PERSIST_COMMANDS.md` template: `persist guard` section replaced with `persist test-gate`;
  generated `persist.yml` already carries `fetch-depth: 0` and is untouched.

## Docs

- `README.md` command table: guard row replaced with test-gate row.
- New `docs/00-product/MIGRATION.md`: 0.6→1.0 notes, starting with the guard-removal line.
- Module memory updated for `hooks`, `config`, `doctor`, `cli`, `generator`.

## Security Impact

This module executes a user-supplied command from config, which is the feature's main
trust-sensitive surface. Containment, all in the implementation:

- `testCommand` is split on whitespace and run with `execFile` (no shell), so shell metacharacters
  in config cannot inject commands. The schema additionally rejects control characters and caps
  length at 200.
- The command runs with the invoking user's privileges in the repository root — same as any hook
  gate before it. No elevation, no network, no new trust boundary.
- A null `testCommand` runs nothing. Multi-word quoted invocations are unsupported by design and
  must live in a `package.json` script, which the user already trusts.
