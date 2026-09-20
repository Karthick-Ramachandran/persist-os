# Completion Report: Skills v2

## Status

Complete.

## Tests Run

- pnpm test:run: 62 files, 373/373 pass (13 new tests added in this module).
- pnpm typecheck, pnpm lint, pnpm format:check, pnpm build: clean.
- node dist/cli.js doctor on this repo: zero errors.
- Manual: generated `scan-secrets.sh` runs read-only; `persist skill list` shows exactly three
  skills.

## Results

- Catalog is three rewritten skills (278/281/255 words rendered; descriptions 41/46/42 words —
  inside the 20–60 router budget).
- `persist init` names executable files written; this repo's own skills regenerated (nine retired
  dirs removed, three rewritten, one script pair).
- Own doctor: zero errors. Historical feature docs citing the superseded scriptless-skills decision
  warn honestly as superseded references (warning, not error); historical docs are left untouched.

## Content routing (criterion 10)

- `create-adr`, `create-prd` → Tools already in the CLI. Nothing to route.
- `implement-task`, `completion-report` → Rules. Their stop conditions were audited against
  `AGENTS.md`/`CLAUDE.md`: all present except "stop when tests cannot be designed from the available
  requirements", which is now an `AGENTS.md` rule. Report procedure lives in `QUALITY_GATES.md`
  already.
- `plan-module`, `update-module-memory` → Reference `docs/ai/MODULE_DELIVERY_WORKFLOW.md` (feature
  shape corrected to the current scaffold, preset reference fixed, memory-update section added),
  linked from `plan-feature` Resources.
- `write-tests` → dropped: the test gate checks the property directly.
- `architecture-drift-review` → dropped: deterministic drift lives in doctor checks; open-ended
  comparison is general model capability.
- `capture-mcp-context` → dropped from the catalog; `mcp add` still installs the file as a fill-in
  skeleton, and the command doc sentence says so.

## Cursor routing fields

Neither `paths` nor `disable-model-invocation` on any of the three skills. All three are broadly
applicable across file types, so scoping by path would misroute; explicit-only invocation
contradicts the auto-trigger design. No change is the reasonable outcome here.

## Capability statement

No surviving skill lost its core job. `plan-feature` no longer special-cases module requests (it
links the module workflow reference instead); `security-review` gained the secret-scan script;
`conventions-adherence` is unchanged in job with earned sections. The nine retirements are the
expected breaking change.

## Remaining risks

- Trigger terms are a heuristic proxy for routing, not a model judgment; a genuinely worse
  description could still pass if it keeps the keywords.
- The secret-scan pattern list is narrow by design; it catches common accidents, not novel
  exfiltration.
