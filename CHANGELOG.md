# Changelog

## 1.7.0

**The fence warning names the lines it means.** A crossing no longer says "ask why the existing
logic is shaped this way" about a whole file: it names the old-side line ranges the diff rewrites
with git's hunk context (`line 2 (in \`export function splitEvenly(items)
{\`)`), the insertion points of a pure addition (`adds lines at 12, 40`), or `binary
change`— at most three ranges, then`and N
more`. A rename is judged as its new path with ranges from the rename pair's diff. `--json`carries the same spans as an additive optional`ranges`
array. Same severity, check id, and scope: every change that warned still warns until a human
answers for that file.

**"No constraint" is an answer, and it is recorded.**
`persist fence add <path> --no-constraint --by <name>` records that a named human confirmed nothing
in the file is deliberate, and the file stays quiet from then on. A later `--why` replaces the
standing line and keeps the history; `--no-constraint` over a recorded reason is refused and writes
nothing. No-constraint entries are not injected into sessions — they answer nothing an agent needs
before editing — and the rot checks treat them like any fence entry. ADR-0020 records the
rule and refines ADR-0010.

**The agent asks, or hands back something answerable.** With a human in the conversation, one
question per file quoting the warning's ranges, recorded with the matching command (`--why` with
their reason, or `--no-constraint`) — never picked by the agent. Unattended, each warning goes in
the "Needs your review" list with the question and both ready-to-run commands. A reason given in
conversation is recorded with `persist fence add` right then. And the "done" rule stops
contradicting itself: done when doctor reports no errors, the tests pass, and every warning is fixed
or listed under Needs your review — `PASSED` is the goal, not a condition an agent can meet without
a human.

**Upgrading:** the SessionStart hook changed (no-constraint entries are no longer injected, and the
base text carries the new done rule): run `persist hooks sync` when doctor reports hook drift on
`.claude/hooks/session-start.sh`. The config schema is unchanged; the CLI change is one additive
option (`--no-constraint`).

## 1.6.1

**The fence counts only a decision that holds.** An ADR reference now means an Accepted, not
superseded ADR naming the changed path as a whole path. A change named only by a Proposed ADR is
reported for review as info ("covered only by Proposed ADR-0002 (Title), pending review") instead of
going quiet, and a substring or near-miss mention (`src/a.tsx` for a change to `src/a.ts`) warns
exactly as an unrecorded crossing. Files under `docs/adrs/proposed/` (`ADR-PROPOSED-<slug>.md`)
count as Proposed; the ADR index, the template, and any other note in the folder no longer count.
ADR-0019 records the rule and refines ADR-0010.

**Pending proposals are visible.** The ADR count now reads
`2 ADRs detected (1 accepted, 1 proposed).`, and each Proposed ADR — numbered or under
`docs/adrs/proposed/` — gets an info line naming it and the `persist adr accept <slug>` command,
until a human accepts or rejects it. Info only: a pending proposal never warns, never errors, and
never blocks a commit.

**SessionStart stops calling every ADR accepted.** The SessionStart hook listed each ADR file under
"Accepted ADRs" whatever its status, so a Proposed draft read as an accepted decision in every later
session. Each ADR now goes on exactly one list by its `## Status` section: Accepted ones keep the
existing list, Proposed ones (plus every file under `docs/adrs/proposed/`) ride a new "Proposed
ADRs, pending review, not binding:" list right after it, and anything else stays unlisted.
Repositories with only accepted decisions inject byte-identical text to before.

**Upgrading:** if doctor reports a new fence info finding on a Proposed ADR, accept the ADR when it
records why the code is shaped that way, or record the reason with `persist fence add`. The fence
stays read-only with no new configuration, the warning stays a warning, and the config schema is
unchanged. The SessionStart hook changed too: run `persist hooks sync` when doctor reports hook
drift on `.claude/hooks/session-start.sh`.

## 1.6.0

**Lessons arrive by area, not as one long list.** `LESSONS.md` keeps every lesson but groups them: a
short `Always` section for what every task needs, area sections with `Applies To` lists for the
rest. The `Always` bullets load into every session after the fence index, inside the same 24 KB
always-loaded budget. `persist context` and the prompt hook hand over only the matching areas (at
most two, three lessons each) after the decisions and Start Here files, with a one-line
`More lessons` index naming the rest. A flat `LESSONS.md` with no sections behaves exactly as
before, and `init` never rewrites an existing one. ADR-0018 records the format and delivery.

**Upgrading:** group existing lessons under areas with `Applies To` lists when doctor suggests it —
nothing is restructured automatically. `init` writes the sectioned template for new repositories;
re-running it never touches your `LESSONS.md`. The config schema is unchanged.

**Doctor keeps the shape honest.** The content check warns when `Always` outgrows the few lessons
every task needs (12 bullets or about 1.5 KB), when the whole file passes about 12 KB, and when an
area's `Applies To` matches no file in the repository — and notes when a 20-lesson file has no areas
at all. The code-reference check now scans `LESSONS.md` too, so a lesson citing a deleted file is
flagged like any other stale pointer.

## 1.5.0

**Works out of the box on any stack.** `init` detects the test command and pre-push gates for
Composer (Laravel, Pest, PHPUnit, or an explicit `composer test` script), Python (pytest with
`uv run`/`poetry run` prefixes, or `python manage.py test` for Django), Go (`go test` with
`go vet`), Rust (`cargo test` with Clippy only when configured), Ruby (RSpec or `bin/rails test`
with RuboCop when configured), and a `Makefile` fallback — first match wins in that order, and
`init` prints what it chose alongside what else it detected. Detection still only proposes one-shot
commands as editable config values and never runs a tool. A JavaScript-only repository resolves
byte-identically to 1.4.1.

**A quieter fence.** Newly added files never count as crossings — a new file has no existing logic
to misunderstand — in the staged set, the unpushed commits, and the working tree alike (renames are
judged as their new path). The built-in skip list grows with framework generated and cache folders
(`bootstrap/cache/`, `storage/framework/`, `var/cache/`, `__pycache__/`, and friends), while
configuration and migration folders stay in scope. The governing-ADRs check still names the decision
for a new file under an ADR's Applies To paths. ADR-0017 records both changes and stays Proposed.

**Upgrading:** re-run `persist init --reinit --force` to re-detect gates for the new stacks, or set
`testCommand` and `prePushGates` in `.persist/config.json` by hand; the config schema is unchanged.

**Doctor follows memory to code in any layout.** The code-reference and staleness checks, and the
context search's file bonus, only recognised paths under `src/` and `tests/`. In a Next.js app
(`app/`, `components/`), a monorepo (`apps/`, `packages/`), a Python package, or a Go project
(`cmd/`, `internal/`), memory pointing at a deleted or long-changed file passed doctor, because
nothing was checked. A code path is now any backticked relative file path whose first folder is a
top-level code folder in the repository; dependencies, build output, hidden folders, and the memory
folder are skipped, and `src/` and `tests/` always count, so existing repositories behave exactly as
before.

**A CLAUDE.md linked to AGENTS.md no longer blocks every commit.** Many repositories keep one rules
file and link the rest to it. Doctor checked files without following links, reported `CLAUDE.md` as
missing, and that error made the pre-commit hook refuse every commit. Doctor now follows a link
whose target is a file inside the repository; a link that points outside it, or nowhere, still
counts as missing. The context budget counts linked text once.

## 1.4.0

What 1.0 cut, restored in the leaner format. The skill catalog grows from six to twelve:
`implement-task` (the default for any code change), `write-tests`, `create-adr`, `drift-review`, and
`completion-report` are rewritten from scratch, `module-memory` merges `plan-module` and
`update-module-memory`, and `plan-feature` absorbs `create-prd` by writing a one-page PRD first when
no requirements exist. Every skill carries WHAT and WHEN plus a Skip for clause so routing never
overlaps, and every skill that can make or approve a change ends with the same Stop and ask list,
defined once in `AGENTS.md`. `AGENTS.md` and the Cursor rule also gain the source-of-truth order and
one line per skill. The retired-skills check now names only the four skills that stayed retired,
each with its replacement.

**Doctor judges uncommitted work.** With nothing staged, the change is the unpushed commits plus the
working-tree edits (tracked and untracked, `.gitignore` respected); with no upstream it is the
working tree alone. The staged-only view is unchanged for the pre-commit hook. Decision quotes take
the whole first bullet or paragraph (capped near 300 characters at a word boundary) instead of the
first sentence, and each accepted ADR with no Applies To list gets an info nudge to declare its
paths. ADR-0016 records the catalog change and stays Proposed.

**A/B evidence.** Twelve headless runs (0.6.1, 1.2.4, 1.3.0, and this build, three runs each) of the
Splitr integer-cents decision and tip-feature scenes, one fresh session per scene, memory reset
between runs: the ADR was written and accepted 12/12 with no follow-up, Applies To present in all
nine 1.x runs, suites green 12/12, and the $47.30 + 15% trap case executed to whole cents in 12/12 —
no version produced fractional-cent money. Agents ran doctor in 10/12 runs. The no-card runs never
missed the decision, so the optional SessionStart ADR decision lines (Part C.3) are excluded. Full
table in the release PR (24 sessions, ~$19 of usage).

**Upgrading:** `persist skill create <name>` adds any restored skill to an existing repository
(`module-memory` only with module memory enabled); re-running `init` adds missing skills without
touching existing files. Skills from 1.0 that came back stop reporting as retired.

**Unattended runs never wait on a human.** People hand an agent a PRD and a task list and walk away.
The new Stop and ask block would have halted those runs, and `plan-feature` stopped after planning.
`AGENTS.md` and the Cursor rule now carry a Working unattended section that replaces every "stop and
ask" when nobody is there: keep every accepted ADR intact, and skip and mark blocked anything that
could only be done by breaking one; record new decisions as Proposed ADRs, follow them, and leave
accepting them to the human; write unclear requirements down as tested assumptions; never weaken a
check to get unstuck. The run ends with a "Needs your review" list. Commits under a Proposed ADR
pass the hooks with a warning, so nothing in the tooling blocks.

## 1.3.0

Store the meaning when it is known; retrieve it deterministically. Context cards are one small
Markdown file per area of the codebase (`docs/context/<name>.md`): what the area is for, which task
phrasings it answers, the words people use for it, where to start reading, and which rules apply.
`persist context "<task>"` matches a new task against those stored phrases with deterministic BM25 —
no embeddings, no model calls, no network — and answers in pointers, never whole files. A 38-prompt
retrieval benchmark over a Splitr fixture reports both sets honestly: the 22 stored task phrasings
recall 1.0 at rank 1 and rank 3, while 16 held-out paraphrases that copy no stored phrase recall
7/16 at rank 1 and 11/16 in the top 3. Suffixes strip to a fixpoint, the file bridge only boosts
alongside a field score and names its files, and typos get one Damerau suggestion each on a fallback
pass shown as `logn≈login`.

**The habit that makes it work.** When you finish work in an area, scaffold the card if there is
none (`persist context add <name> --purpose "<one line>"`), then add the task you were just given to
its Answers list, phrased the way it was asked. The agent rules, the Cursor rule, the SessionStart
text, and the new `context` skill all carry this habit; the lookup half rides one rule line
(`persist context "<task>"` before starting, read only what it points at).

**Delivered in layers.** A prompt hook injects the pointers per prompt in Claude Code
(`UserPromptSubmit` → `additionalContext`) and Codex (same shape, project `.codex/hooks.json`);
Cursor's hook API cannot return context, so it is deliberately skipped and covered by the skill and
rule line instead. `persist context --hook <tool>` answers the hook over stdin with at most 1,500
bytes of pointers, silence below the threshold, and never fails the prompt. A `contextHook` toggle
in `.persist/config.json` (default `true`) opts out of the hook files.

**The decision comes with the pointers.** A card's Rules line is a paraphrase, and a paraphrase
drifts; an agent handed "ADR-0001: money is integer cents" once did float division that the Decision
itself forbade. The lookup now quotes the live Decision sentence of every accepted ADR a matched
card's area falls under (cited by id, or governing the card's files), first under the card so the
hook's byte cap never cuts it, once per lookup even when several cards share it.

**A short default loop.** `AGENTS.md` and the Cursor rule open with five steps: start from the
pointers, keep to each "Follow ADR" line, implement with focused tests, check the changed lines
against each governing decision and run tests and doctor, then add the task to the card. The
Required reading is for areas no card covers and for new ground. `adr-compliance` runs a quick check
by default and the full fresh-context review only for large, multi-decision, or money, auth, and
data-model changes.

**Doctor keeps cards honest.** The new `context-cards` check warns on Start Here paths that no
longer exist, on Applies-To files that changed long after the card did (the staleness check's 90-day
gap), and informs on cards with an empty Answers list that no task can find. Cards are also scanned
for superseded ADR references and for git-ignore sharing.

**Upgrading:** run `persist hooks sync` for the SessionStart text and the new prompt-hook files
(`init` never overwrites existing settings — merge the `UserPromptSubmit` entry by hand).
`persist skill create context` adds the skill to an existing repository. ADR-0015 records the
per-tool hook findings and stays Proposed until the maintainer accepts it.

## 1.2.4

Agents follow ADRs again, not just their titles.

**Why this was needed.** In a rehearsal an agent recorded "money is integer cents, including
intermediate calculations" as an ADR, then wrote a tip calculation with a float division under a
comment claiming integer math. The rule "never contradict an accepted ADR" has been in the agent
rules since 0.x, word for word. What 1.0 removed was the step that acted on it: the retired
`implement-task` skill read the ADRs governing an area before coding, and
`architecture-drift-review` compared the diff against them afterwards. Tests that claimed their
substance was routed elsewhere read the Persist OS repository's own files, so they passed while the
routed rules never reached users.

**New skill: `adr-compliance`.** Find the ADRs that govern a change, read each Decision in full,
turn it into rules a line of code can pass or fail, and check every added line against them from a
fresh context, quoting the line. A comment that claims compliance is not evidence. A conflict means
fix the code, or stop and supersede the ADR with a human's agreement. It also flags new dependencies
or interfaces no ADR covers.

**ADRs can say which code they govern.** New ADRs have an `## Applies To` section
(`- src/billing/**`). A new doctor check, `governing-adrs`, names each accepted ADR whose paths a
change touches, with its decision, at commit time (staged changes, or unpushed commits when nothing
is staged). It is info: it points at the rule, and the skill does the judging. Not evaluated when no
ADR lists paths.

**Done includes the ADR check.** The agent rules (`AGENTS.md`, the Cursor rule, the SessionStart
text) now say: before calling work done, check the diff against every accepted ADR governing the
files you changed, reading its Decision rather than its title.

**Skill fixes.** `chestertons-fence` and `plan-feature` linked to Persist OS's own docs (`ADR-0010`,
`docs/ai/MODULE_DELIVERY_WORKFLOW.md`), dead in every user repository. `security-review` carried
Persist's own concerns (symlinks, overwrite policy, templates); it now checks input validation at
trust boundaries. A test now fails if any skill links to a file a fresh repository does not have.

**Upgrading:** `persist skill create adr-compliance` adds the skill to an existing repository. Add
`## Applies To` to the ADRs that govern code. `init` never overwrites `AGENTS.md`, so copy the new
done-rule line across by hand, and run `persist hooks sync` for the SessionStart text.

## 1.2.3

The hooks now actually run, and the fence can't be skipped by committing first.

**`init` switches the git hooks on (ADR-0014).** Git never activates hooks that arrive with a clone,
and `init` used to print `git config core.hooksPath .persist/hooks` and leave it to you. That was
the step people skipped, and then doctor never ran at commit and the test gate never ran at push,
with nothing saying so. Interactive `init` now asks "Turn on the git hooks in this clone?" (default
yes), `--yes` takes the default, and `--no-enable-hooks` opts out. It never replaces a
`core.hooksPath` that another tool such as Husky owns, and changes nothing under `--dry-run` or
outside git. ADR-0002 is superseded by ADR-0014.

**New check: `hooks-active`.** Every other clone still needs the one line, so doctor warns in any
clone where the hooks are off and prints the command. It is info rather than a warning when another
hooks tool owns `core.hooksPath`, and not evaluated outside git and in CI (the `CI` variable), where
hooks never apply and a warning would fail the generated workflow.

**The hooks work without a global install.** They call your installed `persist`, or `npx persist-os`
when it isn't on your PATH. Before, a project set up with `npx persist-os init` got hooks that
failed every commit with "persist: command not found".

**"Done" means doctor passes.** The generated agent rules now say work is finished only when
`persist doctor` reports PASSED and the tests pass: errors fixed, each warning fixed or named with a
reason. They also tell the agent to run `npx persist-os <command>` when `persist` isn't installed.

**The fence asks about commits that skipped it.** The fence check judged only the staged set. Run
doctor after committing (for example with the hooks off, which is how an agent often works) and
nothing was staged, so the check passed a change that never met the fence. An agent then quoted that
pass as evidence. With nothing staged, doctor now checks the commits the branch hasn't pushed yet,
and says "Unpushed change crosses the Chesterton fence". With no upstream to compare against it
reports **not evaluated** with the reason, instead of an empty pass.

When something is staged, the check behaves exactly as before: only the commit being made is judged,
so an earlier unpushed crossing isn't repeated on every later commit. A commit that only deletes
files counts as staged.

**Upgrading:** the hooks changed, so doctor shows `hook-drift` on them. Run `persist hooks sync`.
`init` never overwrites `AGENTS.md` or the Cursor rule, so the new agent rules only reach new
repositories; copy the changed lines across by hand if you want them. Existing clones get the
`hooks-active` warning until the hooks are switched on.

## 1.2.2

**The generated `CLAUDE.md` is one line: `@AGENTS.md`.** Claude loads `CLAUDE.md` in every session,
so everything in it is paid for every time. The old file explained itself ("this file is loaded
automatically…"), repeated the rules `AGENTS.md` already carries, described the SessionStart hook,
and hardcoded `docs/`, which was wrong once the memory moved. The import does the whole job.

`init` still never replaces a `CLAUDE.md` that exists, so existing repositories keep theirs; replace
it by hand if you want the lean version. The SessionStart hook's text is unchanged on purpose: in a
repository that already had its own `CLAUDE.md`, nothing imports `AGENTS.md`, and the hook is what
tells the agent Persist is there.

## 1.2.1

Three checks that looked like they worked, found while scripting a demo on a real repository.

**`adopt` follows a moved memory folder.** It wrote its report to a fixed `docs/adopt/`, printed
fixed `docs/` paths in its next steps, and always suggested running `persist init`, even in an
initialised repository. The report now goes to `<docsDir>/adopt/`, the next steps name the real
paths, and the init hint only appears when there is no config. Output for the default layout is
unchanged.

**The superseded check reads the memory that is always loaded.** It only scanned feature and module
folders, which are opt-in since 1.0, so in a default repository it scanned nothing and still
reported a pass. A superseded ADR cited in `CONVENTIONS.md`, which loads into every session, went
unflagged. It now also scans the required docs and `FENCES.md`, and reports **not evaluated** when
there is nothing to scan. The ADR folder is left out on purpose, because a new ADR legitimately
links back to the one it replaces.

**New check: memory that git won't share.** A `.gitignore` that excludes `CLAUDE.md` or `.claude/`
keeps the memory on one machine while the rest of the team starts with nothing. Doctor now warns for
every memory file that exists but is ignored. It reports **not evaluated** outside a git repository.

## 1.2.0

**A relocated memory folder keeps loading into sessions.** `docsDir`, `adrDir` and `modulesDir` in
`.persist/config.json` moved the memory for doctor and every command, but the Claude SessionStart
hook read fixed `docs/` paths. A repository that moved `docs/` passed doctor while every session
loaded no ADRs, no modules and no fence index. The hook now reads those paths from the config when
it runs, falling back to the default layout. The README documents how to relocate.

**`persist hooks sync` regenerates the hooks, and nothing else.** Doctor's `hook-drift` warning used
to say `persist init --force --reinit`, which rewrites every generated file (a filled-in
`PRODUCT.md` came back as the template) and resets the config to defaults. Following a doctor
warning could cost a repository its memory. `hooks sync` rewrites only the generated hook scripts
from the current config, reports matching ones as unchanged, and creates `.claude/settings.json`
only when it is missing. Docs, config and agent files are never touched. The warning now points at
it, and the missing-Cursor-rule warning points at plain `persist init`, which only adds missing
files.

**Upgrading:** the SessionStart hook changed, so doctor shows one `hook-drift` warning on
`.claude/hooks/session-start.sh`. Run `persist hooks sync`.

## 1.1.2

Three edges of the fence, found by probing rather than by anything failing.

**`fence add` refuses a path that does not exist.** It used to report success and let the next
doctor run contradict it, so a typo silently produced a dead fence. Existence is checked against the
normalised path, so `src/a.ts:symbol` checks the file part, and `--dry-run` refuses too.

**The context budget sees the fence index.** `ALWAYS_LOADED` counted `CLAUDE.md`, `AGENTS.md` and
the Cursor rule — but the SessionStart hook injects the fence index, so that is always-loaded
context as well. An 80KB `FENCES.md` produced no finding at all. Doctor now names the truncation the
hook was already doing silently, so reasons that never reach a session are visible.

**`fence add` requires an initialised repository.** It used to fall back to the default config and
write `FENCES.md` into a bare directory. A fence is only ever read by its own repository's hook and
checks, so one recorded outside a repository is never loaded. `skill create`, `mcp add` and `adopt`
keep the fallback — they bootstrap or emit standalone files.

## 1.1.1

**Fences no longer rot silently.** A fence records why a path is shaped the way it is. Rename or
delete that path and the entry pointed at nothing — inert, but still loaded into every session by
the SessionStart hook, which is exactly the stale context the index exists to avoid.
`code-reference` now reads `FENCES.md` and warns when a fenced path no longer exists.

Fence headings are read directly rather than through the shared backticked-path pattern, because a
fence may carry a `:symbol` suffix the pattern does not admit — so a suffixed fence is checked too.

## 1.1.0

### `persist fence add`

The fence could warn but nothing could answer it. Recording a reason meant an agent hand-writing
markdown in a shape two readers parse — `fence-check` looks for a `` ## `path` `` heading and the
`Why:` line under it, and the SessionStart hook greps the same two prefixes. Freehand markdown that
drifts is invisible to both, which makes the fence worthless, and without an agent there was no path
at all.

```sh
persist fence add src/billing.ts --why "Four writes are deliberate." --by "Karthick"
```

A path already fenced keeps its standing reason and gains a dated crossing, because the file is read
by path. The `chestertons-fence` skill now calls the command instead of writing the file itself —
the same reason `create-adr` was retired in 1.0.

### `persist init` explains itself

Every question now says what happens when it is on, what happens when it is off, and marks a
recommendation where there is one. "Enable the Chesterton fence? [Y/n]" asked people to decide on a
feature they had never heard of.

The detected test command used to print as a bare indented line above its question, reading as
output from whatever came before. Explanations are part of the prompt now, separated from the
previous answer so they group with the question below them.

### Defaults no longer look like errors

The default letter in `[Y/n]` was painted with the accent colour — terracotta, which in a terminal
reads as red. It is bold and uncoloured now. The capital already carries the meaning; the colour was
adding alarm.

### A wordmark on init

`persist init` draws the Persist OS wordmark when the terminal is at least 54 columns. Narrower
terminals, and pipes where the width is unknown, keep the compact masthead — a broken wordmark is
worse than none.

### Fixed

**`superseded-check` was flagging history.** A feature folder containing a completion report
describes what was built at the time; its citation of a decision later superseded is accurate rather
than stale. `code-reference` and `staleness` already knew this; `superseded` did not, so every
finished feature citing a replaced decision warned forever. On this repository that was seven of
nine warnings.

## 1.0.1

Documentation only. No code changes.

The npm page for 1.0.0 shipped the README as it stood a few minutes before the landing-page demos
merged, and npm only refreshes a README when a version is published. This carries them across:
adopting an existing repository, recording and accepting a decision, and reading a doctor report,
each using the same verbatim captures the website is checked against.

## 1.0.0

First stable release. `persist` generates less, checks more honestly, and commits to an interface.

### The contract

1.0.0 promises **CLI surface and config-schema stability**
([ADR-0011](docs/adrs/ADR-0011-one-zero-stability-contract.md)). Command names, flags,
`.persist/config.json` fields and doctor's exit codes (`0` pass, `1` warnings, `2` errors) stay
compatible within 1.x. Generated document content keeps improving and is tracked by
`templateVersion`.

### Breaking

Both are named in [MIGRATION.md](docs/00-product/MIGRATION.md) with the exact edit each needs.

- **`preset` removed from config, and the preset system retired.** Ten presets,
  `persist preset list` and `--preset` are gone. An existing config carrying the field fails with a
  message naming the line to delete.
- **`persist guard` removed**, replaced by `persist test-gate`, which runs your tests and requires
  them to pass rather than checking that a test file was touched.

### Less ceremony

- Required documents drop from **14 to 6** plus `docs/adrs/`.
- `persist feature create` writes **2 files**, or 3 when a test command is configured — down from 9.
- Features and modules are opt-in.
- The skill catalog drops from **12 to 3**, all rewritten: `plan-feature`, `security-review`,
  `conventions-adherence`. `Required Reading` sections are gone, so a triggered skill costs its own
  body instead of eight documents.

### An honest gate

- Doctor reports **which checks it could not evaluate, and why**, instead of reporting `PASSED` for
  work it did not do. This closed two real holes: the staleness check silently evaluating nothing on
  a shallow CI clone, and checks whose input documents became optional.
- Hooks split by cost: doctor at commit (~1.7s), tests and type checks at push.
- New checks for hook drift and for retired skills left on disk.

### Other

- `persist init` is interactive, with `--yes` and non-TTY detection for CI.
- Generated skills may ship read-only scripts
  ([ADR-0012](docs/adrs/ADR-0012-generated-skills-may-ship-scripts.md)).
- `persist adopt` reads runtime dependencies only, so a library that tests against a framework no
  longer gets that framework proposed as a decision.
- The published package ships 9 files instead of 271.

### Known

- **Warnings block commits.** The generated pre-commit hook runs `persist doctor` under `set -e`,
  and doctor exits 1 on warnings, so a repository cannot commit until template sections are filled.
  The hook is generated content rather than frozen interface, so this can change in a patch release.
- `persist adopt` still reads dev-only packages as signals in Cargo, Composer, Gemfile and
  requirements files. Every signal is proposed rather than accepted.
