# Hooks Test Plan

## Unit Tests

- Detection returns an empty list with no `package.json`.
- Detection maps pnpm, yarn, and npm lockfiles to the right package manager.
- Detection proposes gates only for known scripts.
- Detection returns empty on invalid `package.json`.
- Rendering produces a shebang, runs `recall doctor`, and appends gates in order.
- Rendering documents the activation command.

## Integration Tests

- `recall init` writes an executable `.recall/hooks/pre-commit` and proposes activation.
- An existing hook is skipped unless `--force`.

## Safety

- The hook is written through the safe writer, inside the project root, with symlink protection.
- Detection never executes repository content.

## Results

- Covered by `tests/unit/hooks/detect-gates.test.ts`, `tests/unit/hooks/generate-hook.test.ts`,
  `tests/unit/filesystem/write-file-safe.test.ts`, and `tests/integration/init-command.test.ts`.
