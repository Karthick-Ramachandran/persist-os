# Persist OS Commands

This document records the Persist OS commands available to humans and AI agents.

## Completion Gate

Before claiming implementation work is complete, run:

```txt
pnpm test:run
pnpm typecheck
persist doctor
```

If `persist doctor` reports errors, fix them or report why they cannot be fixed. If it reports
warnings, address them or record why they are acceptable.

Package binary behavior is covered by binary integration tests.

## Commands

### `persist init`

Initialize neutral repository memory.

On a TTY with no explicit flags, init asks four questions and writes the minimum consistent with
the answers: which AI tools (`claude`, `codex`, `cursor`, `generic`), whether to track features,
whether to track modules, and whether to enable the test gate (the detected test command is shown
first). Explicit flags, `--yes`, or a non-TTY stdin skip the questions; a non-TTY run says so.

Options:

- `--ai-tools <list>`: comma-separated AI tools to generate files for.
- `--features`: generate opt-in feature workflow scaffolding.
- `--modules`: generate opt-in module workflow scaffolding.
- `--yes`: take every default without prompting.
- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.
- `--reinit`: required with `--force` to overwrite an existing Persist OS installation (a directory
  that already has `.persist/config.json`). Without it, `--force` refuses, protecting existing
  repository memory.

Init also generates tracked hooks at `.persist/hooks/`: pre-commit runs `persist doctor` plus any
`preCommitGates`; pre-push runs `persist test-gate` plus `prePushGates`. Init proposes, but does not
run, the activation command `git config core.hooksPath .persist/hooks`.

### `persist adopt`

Inspect an existing repository through read-only manifest and marker files, then write a proposed
adoption report and proposed framework ADRs for human review. Adopt never executes repository code
and never produces accepted memory.

Options:

- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.

### `persist skill create <name>`

Generate a portable AI agent skill as `SKILL.md` for both Claude Code (`.claude/skills/`) and the
portable Agent Skills target (`.agents/skills/`). Known names use the built-in catalog; unknown
names produce a valid skeleton. Catalog skills may ship an executable `scripts/`
directory; a skill always works with its scripts deleted.

Options:

- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.

### `persist skill list`

List the built-in catalog skills.

### `persist mcp add <server>`

Generate offline, proposed memory for an MCP server (for example `figma`) as
`docs/ai/mcp/<server>.md` plus a proposed adoption ADR. Persist OS never connects to the MCP server
or makes network calls; the agent records durable MCP-derived context into the generated memory for
human review. It also installs a `capture-mcp-context` skill skeleton for the agent to fill in
and use when recording that context.

Options:

- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.

### `persist feature create <name>`

Create feature memory docs under the configured features directory.

Options:

- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.

### `persist adr create <title>`

Create a proposed ADR under the configured ADR directory.

Options:

- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.

### `persist adr accept <name>`

Promote a proposed ADR to accepted repository memory. A proposal under
`docs/adrs/proposed/ADR-PROPOSED-<slug>.md` becomes a numbered, accepted `ADR-####-<slug>.md` and
the proposal is removed; an existing numbered Proposed ADR is accepted in place.

Options:

- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.

### `persist module create <name>`

Create module memory docs under the configured modules directory.

Options:

- `--dry-run`: show planned writes without writing files.
- `--force`: overwrite existing files explicitly.

### `persist doctor`

Check whether repository memory is structurally healthy enough for AI-assisted work, whether basic
engineering evidence is present, and whether memory references decisions that exist and are
accepted.

Doctor also runs deterministic drift checks: feature or module memory that references a missing ADR
is an error, and memory that references a not-yet-accepted ADR is a warning.

Exit codes:

- `0`: healthy
- `1`: warnings only
- `2`: errors

### `persist context "<task>"`

Look up the area memory a task needs. Scores context cards (`docs/context/`) with deterministic
BM25 over their Answers, Also Known As, Purpose, title, Rules, Pitfalls, and Start Here fields,
boosted when the task names a tracked file the record covers. Prints the top cards (default 3)
as pointers — Start Here paths, Rules, Pitfalls — with the matched terms, never whole files.
When no card covers the task, the closest accepted ADRs, fences, conventions, and lessons are
listed instead, marked as such; when nothing matches, it says so plainly. Exit 0 either way.
Read-only.

Options:

- `--json`: emit the same content as JSON.
- `--limit <n>`: maximum cards shown (default 3).
- `--hook <tool>` (`claude` or `codex`): answer a prompt hook — read the tool's hook input from
  stdin, extract the prompt, and print the tool's expected output with at most about 1,500 bytes
  of pointers, or nothing below the threshold.

### `persist context add <name>`

Scaffold a context card for an area of the codebase. Writes the exact card shape with empty
sections through the write plan; the agent fills them by hand, above all the Answers list with
the task just finished, phrased the way it was asked. Refuses to overwrite an existing card and
refuses outside an initialised repository.

Options:

- `--purpose "<one line>"`: required. What the area is for.
- `--dry-run`: show planned writes without writing files.
