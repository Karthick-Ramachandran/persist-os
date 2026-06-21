# Review: Pre Push Regression Gate

## Status

Reviewed.

## Notes

- Additive: exactly one new generated file (`.recall/hooks/pre-push`), proven by diffing default
  output against published 0.3.1.
- Reuses `preCommitGates` (no config schema change), mirrors the accepted pre-commit hook pattern.
- Not auto-activated; existing pre-commit hook and all other files unchanged.
