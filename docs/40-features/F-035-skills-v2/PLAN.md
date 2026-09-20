# Plan: Skills v2

1. Accept ADR-0008 and ADR-0012 with `persist adr accept` (in-place); confirm
   Status Accepted.
2. Supersede the scriptless-skills ADR with the CLI (`persist adr supersede
   skill-generation-portable-and-scriptless "Generated Skills May Ship
   Scripts"`); remove the scriptless MVP line from `CLAUDE.md`/`AGENTS.md`.
3. Rewrite `skill-catalog.ts`: new earned-section type, three skills from
   scratch, secret-scan script on `security-review`.
4. Rewrite `render-skill.ts` (earned sections) and reshape the skeleton;
   `generate-skill.ts` emits `scripts/` entries through the write pipeline.
5. `init.ts` names executable files written; security model and threat model
   gain executable-output coverage; skill-related doc sentences updated.
6. Regenerate this repo's own skills (remove nine retired dirs, create three).
7. Tests: catalog shape (3 names, format, no Required Reading, word ceiling,
   Verification/Output, earned headings, workflow length), trigger-term tests
   per skill with cross-exclusion, script constraint tests (no network tokens,
   no writes, prose fallback, exec bit via pipeline, init naming), retired-skills
   both ways; update golden, skill-command, guided-output, mcp docs tests.
8. Module memory, review, completion report, evidence chain.
