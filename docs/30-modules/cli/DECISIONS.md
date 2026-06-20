# CLI Decisions

## P5: Parser Now, Bin Later

P5 adds Commander parser wiring and a testable `main(argv, io)` entrypoint.

Package `bin`, build, and release wiring are deferred to P10 so the project does not expose a broken installed binary.

## P5: Output Is Evidence

CLI output should list created, skipped, overwritten, or planned files.

Completion claims must be backed by write results.

## P6: Commands Orchestrate Only

`feature create` command code loads config, calls naming, generator, and filesystem modules, then formats output.

The CLI layer does not own feature numbering, document content, or write safety rules.

## P7: ADR Create Follows Command Boundary

`adr create` command code loads config, calls naming, generator, and filesystem modules, then formats output.

The CLI layer does not own ADR numbering, document content, or write safety rules.

## P8: Shared Write Summary Helper

Command output uses a shared write-summary helper for created, overwritten, skipped, and planned file lists.

Config loading and command error handling remain command-specific in P8.

## P8: Module Create Follows Command Boundary

`module create` command code loads config, calls naming, generator, and filesystem modules, then formats output.

The CLI layer does not own module document content or write safety rules.
