# Acceptance: Checks Rewrite

1. A minimal repository (six documents, some ADRs, no features, no modules) gets evaluated — not
   not-evaluated — from all five checks.
2. A full repository with features and modules gets everything it gets today; no check is narrower
   than before.
3. An accepted ADR missing its consequences section is still flagged.
4. An ADR citing `src/does/not/exist.ts` is still flagged.
5. An unfilled `CONVENTIONS.md` or `PRODUCT.md` template is flagged.
6. A completed feature's `ARCHITECTURE_IMPACT.md` citing since-deleted code is not flagged; an
   in-progress feature's is. This repository's six preset and guard warnings go away with no
   historical document edited.
7. Shallow clone and non-git repositories still report staleness as not-evaluated with the existing
   reasons.
8. Exit codes and severities are unchanged for every scenario that exists today.
9. This repository's own `persist doctor` still passes with no new errors.
