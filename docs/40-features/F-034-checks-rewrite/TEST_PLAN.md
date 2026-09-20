# Test Plan: Checks Rewrite

For each of the five checks, in its existing unit test file:

- Fires on a real problem in the new memory (broken required-doc link; placeholder alternatives;
  sensitive decision without security notes; unfilled PRODUCT template; ADR citing a missing source
  path; ADR citing code changed long after).
- Quiet on healthy new memory (resolving links; substantive alternatives; filled PRODUCT; existing
  references; memory and code committed together).
- Still fires on the old memory shape with features and modules enabled (existing tests retained:
  TEST_PLAN gate, completion evidence, PRD/module templates, module code references, PRD staleness).
- Not-evaluated with a reason when it genuinely cannot run (no config, and the pre-existing
  empty-memory, shallow-clone, and non-git cases).

For code-reference and staleness specifically: a completed feature's planning docs are treated as
history (missing reference quiet, no staleness finding), and an in-progress feature's are not (both
fire).

Integration: the minimal-memory bare-init test is updated to the new honest mix (memory-integrity
and code-references evaluate; standards, content, and staleness stay not-evaluated), and the
full-repo test keeps asserting zero errors. The not-evaluated suite keeps asserting config-missing,
shallow-clone, non-git, and full-history behavior.

Regression guard: no rewritten check may match nothing on a minimal repository; every new-memory
test asserts a finding fires, and the minimal fixture asserts each check evaluates.
