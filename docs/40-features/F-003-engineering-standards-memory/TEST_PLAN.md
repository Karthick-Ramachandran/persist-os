# Test Plan: Engineering Standards Memory

## Automated Verification

Run:

```bash
pnpm test:run
pnpm typecheck
```

Expected:

- Existing tests pass.
- Typecheck passes.

## Manual Docs Review

Confirm:

- Engineering Standards Memory is distinct from security and quality.
- Only three docs exist under `docs/60-engineering/`.
- Architecture remains higher than standards in source-of-truth order.
- Secrets, dependencies, documentation, git, releases, migrations, operations, and AI agent behavior are covered inside `ENGINEERING_STANDARDS.md`.
- Repository rules override model preferences.
- Architecture-neutral positioning remains intact.
- No runtime behavior changed.
