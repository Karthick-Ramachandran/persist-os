# CLI Decisions

## P5: Parser Now, Bin Later

P5 adds Commander parser wiring and a testable `main(argv, io)` entrypoint.

Package `bin`, build, and release wiring are deferred to P10 so the project does not expose a broken
installed binary.

## P5: Output Is Evidence

CLI output should list created, skipped, overwritten, or planned files.

Completion claims must be backed by write results.

## P6: Commands Orchestrate Only

`feature create` command code loads config, calls naming, generator, and filesystem modules, then
formats output.

The CLI layer does not own feature numbering, document content, or write safety rules.

## P7: ADR Create Follows Command Boundary

`adr create` command code loads config, calls naming, generator, and filesystem modules, then
formats output.

The CLI layer does not own ADR numbering, document content, or write safety rules.

## P8: Shared Write Summary Helper

Command output uses a shared write-summary helper for created, overwritten, skipped, and planned
file lists.

Config loading and command error handling remain command-specific in P8.

## P8: Module Create Follows Command Boundary

`module create` command code loads config, calls naming, generator, and filesystem modules, then
formats output.

The CLI layer does not own module document content or write safety rules.

## P9: Doctor Is A Completion Gate

The `doctor` command reports repository memory health for humans and AI agents.

The CLI layer dispatches Doctor and returns its exit code, but `core/doctor` owns the health checks
and report content.

## P10: Packaged Binary

P10 exposes the CLI through the `persist` binary.

The binary delegates to the same `main(argv, io)` entrypoint used by integration tests.

## P10: Preset List Is Read-Only

`preset list` reads from the built-in preset registry and formats deterministic output.

It does not apply presets, generate files, or write repository memory.

## Test Gate Replaces Guard (ADR-0009)

`persist guard` is removed; `persist test-gate` runs config `testCommand` and mirrors its exit code
through the existing `state.exitCode` pattern (codes other than 0/1 pass through, so a suite that
exits 3 fails the gate with 3). No new error class: only unexpected failures throw.

## F-036: One Style Module Owns Every Escape Code

CLI color lives in `src/cli/style.ts` and nowhere else: palette, depth detection (truecolor → 256 →
16), and the `NO_COLOR` / `FORCE_COLOR` / non-TTY / `TERM=dumb` switch-off rules. Formatters style
through its helpers; words carry every meaning with or without color. Tests capture non-TTY output,
which is plain, so styling changes no assertion.
