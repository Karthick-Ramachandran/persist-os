# Changelog

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
