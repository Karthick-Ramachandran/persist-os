# Test Plan: Doctor Command

## Unit Tests

- Doctor exit codes are `0`, `1`, and `2` for healthy, warnings-only, and error reports.
- Doctor report formatting groups findings by severity.
- Missing config is an error.
- Invalid config is an error.
- Missing required files are errors.
- Missing feature docs are errors.
- Missing module docs are errors.
- ADR files missing required sections are errors.

## Integration Tests

- Healthy initialized repo exits `0`.
- Missing config exits `2`.
- Invalid config exits `2`.
- Missing root/AI docs exits `2`.
- Missing configured directories exits `2`.
- Feature folder missing required docs exits `2`.
- Module folder missing required docs exits `2`.
- ADR missing required sections exits `2`.
- Doctor output includes info counts.
- Init generates `docs/ai/SPECFORGE_COMMANDS.md`.

## Regression Tests

- Existing init golden tests include the new generated command-reference and README docs.

## Verification

Run:

```txt
pnpm test:run
pnpm typecheck
git diff --check
```
