# Completion Report: Minimal-By-Default Memory

## Status

Complete. All 10 acceptance items verified (see evidence).

## Tests Run

- `pnpm test:run` — 61 files, 341 passed.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` — clean.
- `pnpm build` — success; `node dist/cli.js doctor` — exit as below.

New/rewritten coverage: `generated-minimal.test.ts` (3), `minimal-memory.test.ts` (4),
`memory-integrity-check.test.ts` (3), `retired-skills-check.test.ts` (4), not-evaluated additions in
content/standards/code-reference/staleness suites, scaffold unit tests, config preset-rejection +
0.6.x back-compat, init opt-in flags. Deleted: 7 preset goldens, 3 preset unit files,
`preset-list-command.test.ts`. Rewritten: feature-create scaffold assertions, doctor-command
required-docs/dirs/JSON expectations, count assertions (12→13 checks) in the two outcome suites,
healthy-repo tests now build full repos.

## Results

Default init writes 42 files (verified by golden test); minimal doctor exits 0 with five reasoned
not-evaluated outcomes; full repos evaluate everything; `preset` in config fails with the fix named;
`--help` is preset-free.

## Remaining Risks

- `docs/10-architecture/OPINION_PACKS.md` and `examples/generated-*` still describe the retired
  preset system (left as record; OPINION_PACKS may deserve retirement in 04).
- Dogfood doctor on this repo will warn `retired-skills` only if non-catalog skills exist; verified
  quiet.
- Custom skills are flagged by `retired-skills` by design limitation (message discloses).

## Dogfood close-out (post-review)

- `persist init --force --yes` regenerated hooks byte-identical; `chmod +x` restored on both hooks.
- `.persist/config.json` is init-derived state: `prePushGates` holds the two detected gates
  (`pnpm run typecheck`, `pnpm run lint`), `testCommand` is the detected `pnpm run test:run`,
  `preCommitGates` is `[]` (detector found no pre-commit script). `TEST_PLAN.md` stays required
  because `testCommand` is set.
- `tests/unit/config/config-schema.test.ts` "validates the dogfooded root config" no longer asserts
  deep-equal-to-defaults (false since dogfood enriches gates); it asserts parse-validity plus
  version match and the detected gates. The suite caught the drift itself (340/341) before the fix;
  341/341 after.
- `node dist/cli.js doctor`: zero errors, exit 1 on warnings only. Remaining warnings all audited
  historical/pre-existing (F-018 preset refs exposed by deletion but historical record; F-029/F-030
  missing artifacts; old staleness pairs with mtimes predating this branch; fresh-init CONVENTIONS
  unfilled, which is inherent until a human fills it). No hook-drift, no missing-PRODUCT,
  retired-skills silent.
