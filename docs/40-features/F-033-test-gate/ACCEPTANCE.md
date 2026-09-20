# Acceptance: Test Gate Module

Each item maps to the brief's acceptance criteria.

1. Failing suite + configured gate → non-zero exit and visible test output. (`test-gate` integration
   test with a genuinely failing command.)
2. Passing suite → exit 0. (Integration test with a genuinely passing command.)
3. No `testCommand` → skip loudly, exit 0, message explains how to configure it.
4. Detection prefers `test:run` over `test` in a Vitest `package.json`.
5. Detection returns null with no `package.json` (pytest/Go/Cargo shape) — no guessing.
6. `persist init` prints the test command it selected (and says so when it selected none).
7. Generated pre-commit runs doctor plus `preCommitGates` only; generated pre-push runs
   `persist test-gate` plus `prePushGates`, never doctor.
8. `persist guard` no longer exists; `persist --help` does not list it.
9. Doctor warns on hook/config disagreement; reports `hook-drift` not-evaluated when hooks are
   absent. No exit-code change from not-evaluated alone.
10. A pre-existing config without `testCommand`/`prePushGates` still loads (defaults fill).
11. No-config doctor run records the gated checks as not-evaluated with reasons; JSON keeps
    `schemaVersion`, `status`, `exitCode`, `summary`, `findings` shapes plus `checks`.
12. Full suite green: `pnpm test:run`, `typecheck`, `lint`, `format:check`, `build`,
    `node dist/cli.js doctor` with no errors.
