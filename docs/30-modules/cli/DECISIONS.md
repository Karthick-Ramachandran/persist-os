# CLI Decisions

## P5: Parser Now, Bin Later

P5 adds Commander parser wiring and a testable `main(argv, io)` entrypoint.

Package `bin`, build, and release wiring are deferred to P10 so the project does not expose a broken installed binary.

## P5: Output Is Evidence

CLI output should list created, skipped, overwritten, or planned files.

Completion claims must be backed by write results.
