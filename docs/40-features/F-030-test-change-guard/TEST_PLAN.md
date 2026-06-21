# Test Plan: Test Change Guard

## Unit Tests

- `isTestFile` recognizes test files across ecosystems and files under `tests/`, and rejects plain
  source files.
- `runGuard` flags source-without-tests, passes source-with-tests, passes non-source-only, and skips
  when no source dirs / not a git repo.

## Integration Tests

- In a temp git repo: staging `src/x.ts` alone → `recall guard --source src` exits 1; staging
  `src/x.ts` + `src/x.test.ts` → exits 0.

## Security Tests

- Only runs read-only `git diff`; no network, no writes, graceful on non-git dirs.
