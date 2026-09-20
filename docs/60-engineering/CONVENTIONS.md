# Conventions

The canonical, reusable vocabulary for this repository. Agents reference these by name and reuse
them instead of inventing new components, helpers, or patterns. Repository rules override model
preferences.

## Canonical Primitives

**Writing files.** `createWritePlan` (`src/core/filesystem/write-plan.ts`) then `executeWritePlan`
(`src/core/filesystem/write-file-safe.ts`). Every command that writes goes through this pair. It
refuses paths outside the root, refuses symlinks, rejects duplicate destinations, skips existing
files unless forced, and writes nothing under `--dry-run`. No command calls `writeFile` directly.

**Path safety.** `normalizeOutputPath` and `resolveSafePath` (`src/core/filesystem/safe-path.ts`).
Any user-supplied path — a feature name, a fence path, a configured directory — passes through these
before it reaches the filesystem.

**Terminal output.** `getStyle()` (`src/cli/style.ts`) returns `accent`, `secondary`, `ink`,
`muted`, `ok`, `warn`, `err`, `line`, `bold`, `heading`, `rule`. **Escape codes appear in that file
and nowhere else.** It resolves truecolor, 256-colour and 16-colour, and honours `NO_COLOR`,
`FORCE_COLOR`, `TERM=dumb`, and a non-TTY stdout.

**Prompts.** `createPrompter` (`src/cli/prompt.ts`), built on `node:readline/promises`. No prompting
library, no TUI.

**Command output tails.** `appendWriteSummary` and `appendNextSteps`
(`src/commands/write-summary.ts`). Both describe what was actually written, never a fixed string.

**Tool targeting.** `keepPathForTools` and `filterFilesForTools` (`src/core/aitools/tool-paths.ts`)
decide which generated files a repository's `aiTools` selection actually wants.

**Doctor checks.** Each lives in `src/core/doctor/checks/`, is registered in `runDoctor`
(`src/core/doctor/doctor-check.ts`), and returns either `DoctorFinding[]` or `{ findings, outcome }`
when it needs to report not-evaluated. A `DoctorFinding` is `{ severity, check, message, path? }`.

**Errors.** A command's error class carries a `code` union and `details: string[]` — see
`InitError`, `FenceAddError`. The CLI renders both.

**Tests.** `createTempRoot`, `removeTempRoot`, `runCommand`, `runInitCommand`, `listRelativeFiles`,
`readGeneratedFile` (`tests/helpers/init-test-helpers.ts`), and `FeedOnPrompt`
(`tests/helpers/fake-prompt.ts`) for driving prompts without a TTY.

## Naming Conventions

- Files are kebab-case: `write-file-safe.ts`, `hook-drift-check.ts`.
- A doctor check is `<name>-check.ts` exporting `check<Name>`, with a check id matching the file.
- Generators are `generate-<thing>.ts` exporting `generate<Thing>Files`.
- Renderers are `render<Thing>`, return a string, and never touch the filesystem.
- Commands live at `src/commands/<noun>/<verb>.ts` and export `<verb><Noun>` plus
  `format<Verb><Noun>Result`.
- Tests mirror the source path under `tests/unit/` or `tests/integration/`.

## Rules

- Do not call `writeFile` in a command. Use the write plan.
- Do not emit an ANSI escape outside `src/cli/style.ts`.
- Do not add a dependency. `commander` and `zod` are the whole budget.
- Do not add network calls, telemetry, cloud behaviour, or AI API calls.
- Do not overwrite an existing file by default. `FENCES.md` is the one deliberate exception, because
  every add rewrites the file with one more entry.
- A check that cannot evaluate its input reports **not evaluated** with a reason. It never returns
  an empty finding list to mean "fine".
- A check that reads `docs/40-features/` treats a folder containing `COMPLETION_REPORT.md` as
  history and leaves it alone.
- Colour carries no meaning on its own. A failure says `ERROR` and is red; it is never only red.
- Deterministic work belongs in a command, not in a skill that describes doing it by hand.
- A message describing what happened is built from what happened, not from a constant.

## Anti-Patterns

**Returning `[]` from a check that could not run.** Indistinguishable from "I ran and found
nothing". This shipped twice — staleness on a shallow CI clone, and checks whose input documents
became optional — and both reported `PASSED` while doing no work.

**Writing a generated file by hand.** `FENCES.md` and ADRs are parsed by exact shape; freehand
markdown that drifts is invisible to the reader that needs it. Add a command instead.

**Painting something with a status colour because it should stand out.** The default letter in
`[Y/n]` was accent-coloured, which reads as red, on a prompt where nothing is wrong.

**Describing generated output in a fixed string.** `init` once claimed a Claude hook and a Cursor
rule regardless of what it had written. Read `writeResult`.

**Testing the writer and assuming the reader.** A symbol-suffixed fence was written correctly and
matched nothing, because only the write side had a test.
