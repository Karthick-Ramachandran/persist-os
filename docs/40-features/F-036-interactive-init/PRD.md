# PRD: Interactive Init

## CLI design addendum

`~/persist-briefs/06-addendum-cli-design.md` supersedes the brief's "plain questions, typed answers"
line: init carries the product palette (masthead, amber prompts with `[n/4]` progress, accent test
command, colored summary and next steps) under the unchanged no-new-dependencies constraint, with
`NO_COLOR` / `FORCE_COLOR` / non-TTY / `TERM=dumb` switch-off rules and one `src/cli/style.ts`
module owning every escape code. The addendum's acceptance criteria extend the list below.

## Purpose

`persist init` takes flags and assumes the rest. A first-time user must know the flag vocabulary
before they can get the minimum setup that suits them. Per ADR-0007, init asks four questions — AI
tools, features, modules, test gate — then writes the smallest thing that works. Flags remain a
complete non-interactive instruction, and non-TTY stdin behaves as `--yes` so pipelines never hang
on a prompt.

Sources of truth: [ADR-0007](../../adrs/ADR-0007-minimal-by-default-repository-memory.md) (Accepted)
for the questioning decision and [ADR-0011](../../adrs/ADR-0011-one-zero-stability-contract.md)
(Accepted) freezing the CLI surface; brief `~/persist-briefs/06-interactive-init.md` follows both.

## In Scope

- Four questions in order (tools / features / modules / test gate), test-gate question printing the
  detected command first and defaulting to no when none is detected.
- New `--yes` flag; non-TTY stdin behaves as `--yes` and says so.
- Prompts built on `node:readline/promises` in one unit-testable module; no new dependencies, no
  TUI.
- Empty input takes the default; invalid input re-asks.
- Generated docs mention the interactive flow; README quickstart shows it.

## Non-Goals

- Changing what init generates (module 03 settled that).
- Prompting for adopt, feature create, or other commands.
- The fence and its init question; upgrade.

## Decisions

- Any listed flag (`--ai-tools`, `--features`, `--modules`, `--dry-run`, `--force`, `--reinit`) plus
  `--yes` is a complete instruction: no prompting. `--dry-run` alone still prompts on a TTY, exactly
  like a bare run.
- The fence question is not asked: the fence does not exist yet, and modules are asked separately
  because `--features` and `--modules` are separate flags.
- No test may require a real TTY; the piped-stdin regression test carries a timeout so a hang fails
  instead of wedging CI.
