# Review: Test Change Guard

## Status

Reviewed.

## Notes

- Additive new command; opt-in via gate args, so default behavior is unchanged.
- The test-pattern extraction is behavior-preserving: adopt's `inspect-repo` tests pass unchanged.
- Reads git diff read-only and skips gracefully outside a git repo, so it is always safe in a gate.
- `recall doctor` stays git-unaware; the diff logic lives only in `guard`.
