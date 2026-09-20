# Plan: Checks Rewrite

1. `memory-integrity-check.ts`: keep folder and ADR-section checks; add a required-doc
   cross-reference pass over the six required documents (doc-path links must resolve; ADR identifier
   references must match a known ADR, warned when not accepted). Evaluate whenever required docs
   exist, even with no features, modules, or ADRs.
2. `standards-check.ts`: keep feature and ADR-consequence checks; add alternatives-substance and
   security-notes rules for ADRs. Alternatives mirrors the consequences severity; security-notes is
   always a warning (see PRD).
3. `content-check.ts`: keep feature, module, and security-doc checks; add `PRODUCT.md` template
   detection (Purpose, Users) gated on repository work, as the security-doc checks are.
   `CONVENTIONS.md` stays with the conventions check.
4. `code-reference-check.ts`: scan ADRs and `CONVENTIONS.md` in addition to in-progress feature and
   module docs; skip planning docs of features that contain `COMPLETION_REPORT.md`. Not-evaluated
   only when no scannable memory exists at all.
5. `staleness-check.ts`: compare the same widened doc set; same history exclusion; identical git,
   shallow-clone, and non-git handling.
6. `required-files-check.ts`: export the required-doc list for reuse; no behavior change.
   `doctor-check.ts`: unchanged (outcome set identical).
7. Tests: extend the five existing unit test files (fire on new memory, quiet on healthy, still
   fires on old shape, not-evaluated with reason) plus history tests for code-reference and
   staleness; update the two integration tests that encode module-03 abstention.
8. Docs: this folder, doctor module memory, completion report, evidence chain.
