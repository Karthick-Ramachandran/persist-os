# Persist OS

Git tracks what changed. Persist OS tracks why it changed.

This is the product document: what Persist OS is, every command it has, the concepts behind them,
and what is decided but not yet built. It is the current state of the product, not its history.
Accepted ADRs under `docs/adrs/` remain the authority on individual decisions; where this document
and an accepted ADR disagree, the ADR wins and this document is wrong.

## What it is

A local-first TypeScript CLI that creates and maintains AI-ready engineering memory inside a
software repository. It generates the memory, validates it with a deterministic gate, and wires that
gate into git hooks and CI.

Dependencies are `commander` and `zod`. Node 20 or newer. No network calls, no telemetry, no AI API
calls, no cloud. Everything it does happens on the machine it runs on.

## What problem it solves

A coding agent starts every session with no memory of why the code is the way it is. The reasoning
behind a decision lives in a pull request thread, a chat log, or somebody's head — none of which the
agent reads. So it proposes changes that were already rejected, reinvents helpers that already
exist, and removes constraints it cannot see.

Persist OS puts that reasoning in the repository, in files an agent loads and a human reviews, and
refuses to let them rot: a deterministic check fails when memory references code that no longer
exists, claims completion without evidence, or contradicts an accepted decision.

## What it is not

It does not make architecture choices, run models, execute anything from memory, or generate
production application code. It records, distributes, validates, and protects decisions. It does not
make them.

## Commands

### `persist init`

Creates repository memory. Interactive by default: it asks which AI tools you use, whether to track
features and modules, and whether to enable the test gate, then writes the minimum consistent with
the answers.

`--yes` takes every default. A non-TTY stdin behaves as `--yes` and says so, so CI never hangs on a
prompt. `--dry-run` shows the write plan without writing. `--force` with `--reinit` overwrites an
existing installation. `--ai-tools` selects targets explicitly (`claude`, `codex`, `cursor`,
`generic`).

Existing files are never overwritten by default.

### `persist adopt`

Inspects an existing repository and proposes memory for review. It detects languages, the package
manager from the lockfile, and frameworks from runtime dependencies, then writes an adoption report
and proposed ADRs under `docs/adrs/proposed/`.

Everything it produces is proposed. Nothing becomes accepted truth without a human running
`persist adr accept`.

### `persist feature create <name>`

Creates feature memory: `PLAN.md` and `TASKS.md`, plus `TEST_PLAN.md` when a test command is
configured. The third file exists only when something enforces it, so the scaffold never outruns the
gate.

Features are opt-in. A repository that does not track them is not missing anything.

### `persist adr create <title>` · `accept <name>` · `supersede <old> <new-title>`

The decision lifecycle. `create` writes a proposed ADR. `accept` promotes it to accepted repository
memory and removes the proposal. `supersede` marks an accepted decision superseded by a new one, so
the reasoning trail stays intact rather than being overwritten.

An ADR carries Status, Context, Decision, Alternatives Considered, Consequences and Related
Documents. Doctor checks that accepted decisions actually contain consequences and alternatives, not
just a heading.

### `persist module create <name>`

Creates module memory: `MODULE.md`, `TASKS.md`, `TEST_PLAN.md`, `DECISIONS.md`. Opt-in, like
features.

### `persist doctor`

The gate. Reads repository memory and exits `0` (pass), `1` (warnings) or `2` (errors). `--json`
emits a machine-readable report.

Thirteen checks:

| Check              | What it answers                                                             |
| ------------------ | --------------------------------------------------------------------------- |
| `config`           | Does `.persist/config.json` exist and validate?                             |
| `required-files`   | Are the six required documents and the tool entry files present?            |
| `memory-integrity` | Does memory reference documents and ADRs that exist?                        |
| `standards`        | Do accepted decisions carry consequences, alternatives, and security links? |
| `content`          | Is memory filled in, or still an unedited template?                         |
| `conventions`      | Is `CONVENTIONS.md` written?                                                |
| `code-reference`   | Does current memory cite source paths that still exist?                     |
| `staleness`        | Has cited code moved on long after the memory describing it?                |
| `drift`            | Does memory cite missing or not-yet-accepted ADRs?                          |
| `superseded`       | Does memory still cite a decision that has been superseded?                 |
| `context-budget`   | Does the always-loaded set exceed 24KB?                                     |
| `hook-drift`       | Do the generated hooks still match the config that produced them?           |
| `retired-skills`   | Are retired catalog skills still on disk?                                   |

A check that cannot evaluate its input reports **not evaluated**, with the reason, instead of
passing. A gate that silently does nothing while reporting success is worse than no gate, so this is
a property the product treats as load-bearing rather than a nicety.

### `persist test-gate`

Runs the configured test command and requires it to pass. Off by default; `testCommand` in config
turns it on. Detection prefers a one-shot script over a watch runner. With no command configured it
skips loudly and explains how to configure it, rather than passing silently.

### `persist skill create <name>` · `skill list`

Generates agent skills, and lists the built-in catalog. Three ship: `plan-feature`,
`security-review`, `conventions-adherence`. Skills are written to both `.claude/skills/` and
`.agents/skills/` according to the configured AI tools.

A skill is a tiny router plus a procedure. Only its name and description stay in context; the body
loads when it triggers, and referenced documents load only when the workflow reaches them. Skills
may ship read-only local scripts.

### `persist mcp add <server>`

Generates proposed, offline memory for an MCP server: what data it reaches, what permissions it
needs, what the security risks are. The agent with the connection fills it in, a human reviews it,
and `persist adr accept` makes it real.

## Concepts

**Repository memory** is the generated document set. Six documents are required: `PRODUCT.md`,
`ENGINEERING_STANDARDS.md`, `CONVENTIONS.md`, `LESSONS.md`, `SECURITY_MODEL.md`, `QUALITY_GATES.md`,
plus `docs/adrs/`. Everything else — features, modules, architecture, threat model, testing strategy
— is opt-in.

**Source of truth order.** Accepted ADRs, then architecture docs, then engineering standards, then
the product document, then security and testing docs, then module docs, then feature plans, then
task files, then MCP context, then chat history. When sources conflict, an agent stops and reports
rather than choosing.

**Proposed versus accepted.** Nothing becomes repository truth by being generated. Presets are gone
precisely because they proposed architecture opinions that were too easy to absorb silently. Adopt,
MCP and ADR creation all produce proposals a human promotes.

**Gates by cost.** The pre-commit hook runs doctor, which is fast. The pre-push hook runs the test
command and the heavy checks. A gate people disable because it is slow protects nothing.

**Agent does the semantics, the gate stays dumb.** Doctor inspects files and git metadata. It never
judges whether reasoning is any good. Confirming that a decision is genuinely contradicted is the
agent's job; proving the artifact exists is the gate's.

## Decided and being built

**Chesterton's Fence** ([ADR-0010](../adrs/ADR-0010-chestertons-fence.md), Accepted). A record of
why code is shaped the way it is, for the reasoning that never rose to the level of an ADR — the
write that hits four collections deliberately, for a constraint the author has since forgotten.

The fence file lives at docs/60-engineering/FENCES.md and starts empty, growing through use. Fences are never
bulk-generated, by init, by adopt, or by an agent sweeping the codebase: a file of confident
guesses is worse than an empty one. The answer to "why is this here" comes from a human, because
the premise is that the constraint exists only in someone's memory. The file is never required —
its absence means no fence has been crossed yet — and the fifth init question records the
`fenceEnabled` toggle.

Three moments, none of which costs anything per edit: the SessionStart hook injects the fence index
once per session (truncated to the 24KB budget remainder, so a large file never pushes a session
over budget); `adr create` and `adr supersede` trigger before a change; a deterministic
pre-commit rule triggers after, where the diff is visible. It warns rather than blocks, because it
is the first part of the product whose quality depends on an agent rather than a check, and a
blocking gate satisfied by "an agent wrote something plausible" teaches people to write something
plausible.

## Known behaviour worth stating

**Warnings are advisory; errors block.** The generated pre-commit hook runs `persist doctor` and
continues on exit 0 (pass) and exit 1 (warnings), failing only on exit 2 (errors)
([ADR-0013](../adrs/ADR-0013-warnings-are-advisory-in-the-generated-pre-commit-hook.md)). A
repository can commit with unfilled templates — the warnings still print, so they are seen, but
they no longer refuse the commit. This is what the fence's warn-rather-than-block decision
([ADR-0010](../adrs/ADR-0010-chestertons-fence.md)) is built on.

**`adopt` over-detects in raw-text ecosystems.** Cargo, Composer, Gemfile and requirements files are
parsed by pattern, so a dev-only package can still become a signal. Every signal is proposed, so it
is noise rather than breakage.

## Deliberately not built

Named so nobody rediscovers them as gaps:

- **`persist upgrade`** — migrating a repository initialised on an older template without flattening
  hand-edited memory.
- **Doctor baseline** — recording today's failures as accepted debt so only new ones fail, which is
  what makes adoption survivable on a large legacy repository.
- **`persist task`** and **tracker** config — a unit below a feature, and links to Linear or Jira.
- **`branchPolicy`** config.
- **Organization memory** — standards and decisions shared across repositories.

## Related documents

- [PLAN-1.0.md](PLAN-1.0.md) — release sequencing and phases
- [MIGRATION.md](MIGRATION.md) — upgrading from 0.6.x
- [POSITIONING.md](POSITIONING.md), [PRODUCT_VISION.md](PRODUCT_VISION.md)
- [`docs/adrs/`](../adrs/) — every decision, with its reasoning
- [`docs/ai/PERSIST_COMMANDS.md`](../ai/PERSIST_COMMANDS.md) — command reference for agents
- [`docs/90-archive/`](../90-archive/) — pre-1.0 product documents, kept as history
