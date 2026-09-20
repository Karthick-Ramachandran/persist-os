# Completion Report: Chesterton's Fence (F-037)

Last feature in 1.0. Built on the brief `~/persist-briefs/09-chestertons-fence.md` with the
maintainer's three pointers resolved first.

## Prerequisite (built first, per the brief)

ADR-0010's warn premise was verified false (warning → doctor exit 1 → `set -e` hook aborts;
reproduced). Maintainer chose the hook fix; recorded as ADR-0013 (Accepted) and implemented
before the fence. Doctor exit codes untouched (ADR-0011: hook is content). No strictness knob, by
decision — `preCommitGates` is the escape hatch.

## The two open questions

- **Warnings-block-commits:** hook fails on exit 2 only (maintainer decision, ADR-0013).
- **FENCES.md required:** never required, only written (brief option 2, maintainer's stated
  preference); ADR-0010 amended, `requiredDocs` stays flat.
- **Budget:** hook truncates the index to budget − files − base − label with a marker; verified
  files + injection ≤ 24KB on a 287KB FENCES.md fixture.

## What shipped

`fenceEnabled` toggle (default on) with fifth init question; `fence` doctor check (staged diff,
visible scope list, first crossing warns, later crossings surface the Why as info, ADR-referenced
files quiet, disabled/non-git/missing-config report not-evaluated); SessionStart index;
`chestertons-fence` skill (fourth, scriptless, trigger tests both directions); `adr create` /
`supersede` reminders when enabled. ADR-0010 accepted at landing.

## Evidence

`pnpm test:run` 441/441 · `typecheck` · `lint` · `format:check` · `build` clean;
`node dist/cli.js doctor` zero errors; `node scripts/site/check-transcripts.mjs` OK.

## Invalidated (re-record after landing, out of scope)

- `commit-warnings.txt` (warnings now proceed) → site/docs/hooks.html, site/docs/doctor.html.
- `hooks-files.txt` (old pre-commit source) → site/docs/hooks.html.
- `init-*.txt` (new fence status line) → whichever pages embed init output.
- The landing page shows no refusal transcript; its 0/1/2 exit-code docs stay true.

## Remaining risks

Raw-text ecosystems (requirements, Cargo dev-deps, Gemfile groups) still pattern-match test-only
packages — same false-positive class as the npm devDeps fix, proposed-and-reviewable. Pre-existing
warnings untouched: the ADR-0005 security note, the superseded-decision references in F-023/F-025
history, the CONVENTIONS template gap.
