# Acceptance Criteria: Test Change Guard

## Criteria

- `recall guard --source src` exits 1 when a `src/` file is staged with no staged test file, listing
  the offending source files.
- It exits 0 when a matching test file is also staged, or when only non-source files changed.
- It exits 0 (skips) when no `--source` is passed, or the directory is not a git repository.
- Adding `recall guard --source src` to `preCommitGates` makes the generated hooks enforce it.
- Existing behavior is unchanged: nothing calls `guard` by default; `inspect-repo`/adopt detection is
  byte-for-byte unchanged after the pattern extraction.

## Out Of Scope

- Per-language source/test mapping beyond "under a source dir" + "is a test file".
