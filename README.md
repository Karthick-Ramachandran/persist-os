# Persist OS

**Durable, AI-ready engineering memory for your repository — and a deterministic `doctor` that
proves it stays healthy.**

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![Local-first](https://img.shields.io/badge/local--first-yes-success)
![Telemetry](https://img.shields.io/badge/telemetry-none-success)
![Network](https://img.shields.io/badge/network%20calls-none-success)

Persist OS is a local-first CLI that turns a repository into the source of truth for **why** it is
built the way it is. It creates structured, reviewable memory — product intent, architecture
decisions, module ownership, testing and security expectations, AI agent rules — and then
**validates** that memory with `persist doctor`. Architecture-neutral. No network, no telemetry, no
code generation.

[Website](https://persist-os.pages.dev) · [Install](#install) · [Quickstart](#quickstart) ·
[Commands](#commands) · [What Doctor Checks](#what-doctor-checks) ·
[Chesterton's Fence](#chestertons-fence) · [Why I built this](PHILOSOPHY.md) ·
[Contributing](CONTRIBUTING.md)

![Persist OS — creating repository memory, the Chesterton fence catching an unexplained change, recording the reason, and that reason coming back on the next run](https://raw.githubusercontent.com/Karthick-Ramachandran/persist-os/main/docs/media/persist-1.1.gif)

What it writes — plain files, tracked in Git, reviewed in pull requests like any other change:

```txt
your-repo/
├── AGENTS.md                              # entry point every agent reads
├── CLAUDE.md                              # Claude Code's entry point
├── docs/
│   ├── 00-product/PRODUCT.md              # what this is and is not
│   ├── 20-security/SECURITY_MODEL.md
│   ├── 50-quality/QUALITY_GATES.md
│   ├── 60-engineering/
│   │   ├── ENGINEERING_STANDARDS.md
│   │   ├── CONVENTIONS.md                 # the vocabulary agents must reuse
│   │   └── LESSONS.md                     # what broke, and why
│   └── adrs/                              # decisions: proposed → accepted → superseded
├── .claude/skills/, .agents/skills/       # 4 skills, loaded on trigger
├── .persist/hooks/                        # doctor at commit, tests at push
└── .github/workflows/persist.yml
```

Six documents and a decision log. Nothing else is required.

<details>
<summary><strong>Adopt an existing repository</strong> — it proposes, you decide</summary>

```console
$ persist adopt
Persist OS adopt complete.
Inferred signals are proposed and require human review.
Languages: TypeScript
Package manager: pnpm
Frameworks: Next.js
Created:
- docs/adopt/ADOPTION_REPORT.md
- docs/adrs/proposed/ADR-PROPOSED-adopt-nextjs.md

Next steps:
- Review docs/adopt/ADOPTION_REPORT.md — everything in it is proposed.
- Accept or reject each proposed ADR under docs/adrs/proposed/.
```

Signals come from manifests and lockfiles, runtime dependencies only. Nothing it writes is accepted
repository memory until a human says so.

</details>

<details>
<summary><strong>Record a decision</strong> — proposed, then accepted</summary>

```console
$ persist adr create "Use PostgreSQL for primary storage"
ADR: docs/adrs/ADR-0001-use-postgresql-for-primary-storage.md

Next steps:
- Open it and fill: Context, Decision, Alternatives, Consequences.

$ persist adr accept use-postgresql-for-primary-storage
Accepted: docs/adrs/ADR-0001-use-postgresql-for-primary-storage.md

- It is now repository source of truth. Other memory can cite it.
```

Generating a decision does not accept it. Changed your mind later? `persist adr supersede` records
the replacement and keeps the trail.

</details>

<details>
<summary><strong>Check for drift</strong> — warnings print, only errors block</summary>

```console
$ persist doctor
Doctor Report

WARNING
- Product purpose is still an unfilled template. (docs/00-product/PRODUCT.md)
- Conventions canonical-primitives section is still an unfilled template.
  (docs/60-engineering/CONVENTIONS.md)

Result: WARNINGS
```

```txt
Exit codes:  0 = healthy   1 = warnings only   2 = errors
```

The generated pre-commit hook fails on errors. Warnings print and the commit proceeds, so the two
severities mean different things.

</details>

---

AI can write code fast, but its context is temporary — it forgets decisions, compacts conversations,
and drifts from earlier intent. Git records **what** changed. Persist OS records **why**, in a form
humans and agents can re-read and validate before and after work.

```txt
What are we building?   Why did we decide this?
What must not drift?    What evidence proves this work is complete?
```

When these questions live in the repository instead of a chat window, the repository can answer
them.

> **Not a vector memory engine.** Tools like supermemory or mem0 _retrieve_ information with
> embeddings; Persist OS writes the **decisions** themselves — reviewable files, not vectors — and
> checks they stay consistent. They're complementary, not competitors. →
> [Why I built this](PHILOSOPHY.md)

## Why Persist OS

- **Memory that outlives the conversation.** Decisions, constraints, and ownership are committed to
  the repo, not trapped in an agent's context window.
- **A gate, not just docs.** `persist doctor` is deterministic and returns an exit code, so "is this
  work actually finished and consistent?" becomes a check you can run in a hook or CI.
- **Decisions change safely.** When a decision changes, `persist adr supersede` records it (the old
  ADR is marked superseded, the new one links back) and Doctor flags any memory still citing the old
  one — so the trail stays auditable instead of silently contradicted. The generated agent rules
  even carry the CLI commands inline, so your AI tool uses them itself.
- **Fights context rot.** Doctor warns when the always-loaded memory bloats into a wall of text, or
  when it still points at `src/` code that changed long after the memory did — so memory stays a
  lean, current map, not a stale dump.
- **Reuse over reinvent.** Generated `CONVENTIONS.md` (your canonical, reusable vocabulary) and
  `LESSONS.md` (durable pitfalls) load into every agent session, and the agent is told to keep them
  current itself — so it reuses your components and patterns instead of reinventing them, and stops
  repeating mistakes you already solved. It works even on vibe-coded projects, because the agent
  maintains the memory, not you.
- **Architecture-neutral by design.** Persist OS records and protects _your_ decisions. It never
  silently picks a framework, database, or pattern for you.
- **Local-first and private.** No network calls, no telemetry, no AI API calls, no remote templates.
  It runs entirely on your machine.
- **Safe by default.** Non-destructive writes, path-traversal and symlink protection, and a refusal
  to overwrite an existing installation without explicit intent.

## Install

Run it without installing — the quickest way to try it:

```bash
npx persist-os@latest init
```

Every command works the same way: `npx persist-os <command>` (e.g. `npx persist-os doctor`).

Or install the CLI globally:

```bash
npm install -g persist-os
persist --help
```

(Requires Node.js >= 20. Published at
[npmjs.com/package/persist-os](https://www.npmjs.com/package/persist-os).)

## Quickstart

```bash
# 1. Create repository memory — init asks four questions, then writes the minimum
persist init
persist init --yes                     # take every default without prompting
persist init --ai-tools claude,cursor  # flags are a complete instruction: no prompting

# 2. Capture intent and decisions as you work
persist feature create checkout
persist adr create payment-provider
persist adr accept payment-provider    # promote a proposal to accepted memory

# 3. Bring an MCP server's context into durable memory (offline)
persist mcp add figma

# 4. Validate the memory is healthy and complete
persist doctor
```

Every command guides you — it names the file it created, where it is, and what to do next.

Generate files only for the AI tools you use: `persist init --ai-tools claude,cursor` (default: all
of `claude`, `codex`, `cursor`; `AGENTS.md` is always written).

`persist init` also generates tracked **pre-commit and pre-push hooks** in `.persist/hooks/`. The
pre-commit hook runs `persist doctor` plus any `preCommitGates` you configure; the pre-push hook
runs `persist test-gate` (your configured `testCommand`) plus `prePushGates`. The pre-push hook is
the final regression gate before code leaves your machine (it catches commits made with
`--no-verify` or before the hook was active). Enable them once per clone — Persist OS proposes the
command but never runs it for you:

```bash
git config core.hooksPath .persist/hooks
```

## Commands

| Command                             | Purpose                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| `persist init`                      | Create repository memory. Asks four questions, then writes the minimum.        |
| `persist init --ai-tools <list>`    | Generate files only for the AI tools you use (claude, codex, cursor, generic). |
| `persist init --features --modules` | Also generate the opt-in feature/module workflow scaffolding.                  |
| `persist init --yes`                | Take every default without prompting (CI, scripts, non-TTY stdin).             |
| `persist adopt`                     | Inspect an existing repo and propose reviewable memory.                        |
| `persist feature create <name>`     | Scaffold feature memory (plan, tasks, test evidence).                          |
| `persist adr create <title>`        | Create a proposed architecture decision record.                                |
| `persist adr accept <name>`         | Promote a proposed ADR to accepted source-of-truth.                            |
| `persist adr supersede <old> <new>` | Record a changed decision: mark the old ADR superseded by a new accepted ADR.  |
| `persist module create <name>`      | Scaffold module memory (ownership, boundaries, tests).                         |
| `persist skill create <name>`       | Generate a portable AI agent skill (Claude + Agent Skills).                    |
| `persist skill list`                | List the built-in agent skill catalog.                                         |
| `persist mcp add <server>`          | Generate offline, proposed memory for an MCP server.                           |
| `persist doctor`                    | Validate memory health, evidence, and drift.                                   |
| `persist test-gate`                 | Run the configured test command and require it to pass.                        |
| `persist fence add <path> --why`    | Record why a path is shaped the way it is.                                     |
| `persist hooks sync`                | Regenerate the hooks from the config. Never touches docs or config.            |

## What Doctor Checks

`persist doctor` is the part that makes Persist OS more than a template. Every check is
deterministic, local, and read-only.

| Category            | Detects                                                              | Severity     |
| ------------------- | -------------------------------------------------------------------- | ------------ |
| Structure           | Missing config or required documents                                 | error        |
| Memory integrity    | Memory referencing documents or ADRs that do not exist               | error        |
| Completion evidence | Work marked complete with review pending or no test evidence         | error        |
| ADR quality         | An accepted decision with no meaningful consequences or alternatives | error / warn |
| Duplicate decisions | Two ADRs accepted under the same title                               | error / warn |
| Security            | A security-sensitive decision that links no security memory          | warning      |
| Drift               | Memory referencing a missing, or not-yet-accepted, ADR               | error / warn |
| Superseded          | Memory still citing a decision replaced by a newer ADR               | warning      |
| Code references     | Current memory citing `src/` paths that no longer exist              | warning      |
| Staleness           | Memory citing code that changed long after the memory did            | warning      |
| Chesterton fence    | A change to source with no recorded reason and no ADR reference      | warning      |
| Hook drift          | Generated hooks no longer matching the config that produced them     | warning      |
| Retired skills      | Skills retired in a newer release still sitting on disk              | warning      |
| Context budget      | The always-loaded agent files grown past 24KB                        | warning      |
| Content             | Required memory left as an unedited template once real work exists   | warning      |

A check that **cannot** evaluate its input says so — `NOT EVALUATED`, with the reason — instead of
reporting success for work it did not do. A gate that silently passes is worse than no gate.

```txt
Exit codes:  0 = healthy   1 = warnings only   2 = errors
```

Because it returns an exit code, Doctor drops straight into the completion loop:

```bash
pnpm test:run && pnpm typecheck && persist doctor
```

The generated pre-commit hook runs Doctor and fails only on **errors** — warnings print and let the
commit through, so the two severities mean different things. Add `persist doctor` to
`preCommitGates` if you want warnings to block too.

Use it locally via the generated hooks, or add `persist doctor` as a step in CI. Add `--json`
(`persist doctor --json`) for a stable, machine-readable report — handy for CI artifacts, hooks, and
agent handoffs.

## Opt-In Memory

`persist init` generates the minimal set by default: six documents plus the ADR directory. Feature
and module workflow memory is opt-in — pass `persist init --features --modules`, or run
`persist feature create` / `persist module create` whenever you need them. Doctor treats absent
opt-in memory as not-evaluated (with a reason), never as an error.

## Chesterton's Fence

Git records what changed. ADRs record the decisions worth a document. Neither records why a piece of
code is _shaped_ the way it is when that reasoning never rose to that level.

You wrote a query that hits four collections instead of one, deliberately, because of a constraint.
Months later nobody remembers it — including you. An agent reads the code, concludes one call would
be simpler, and removes the constraint. Nothing notices until production does.

`docs/60-engineering/FENCES.md` is where that reasoning lives. It **starts empty and grows through
use**: nothing generates it, not `init`, not `adopt`, not an agent sweeping your codebase. A file of
confident guesses about why code exists is worse than an empty one.

When a change touches source with no recorded reason and no ADR reference, Doctor says so. The
`chestertons-fence` skill walks an agent through the three questions — what is changing, what logic
was already there and why, what might break — and a human confirms the answer, because the whole
premise is that the constraint lives in someone's memory rather than in the code.

When you answer, record it:

```sh
persist fence add src/billing.ts \
  --why "Four collection writes are deliberate; ledger and audit trail land in one transaction." \
  --by "Karthick"
```

From then on, a change to that path hands the reason back instead of asking again:

```console
$ persist doctor
WARNING
- Change touches a recorded fence: Four collection writes are deliberate; ledger and
  audit trail land in one transaction. Confirm the reason still holds before changing
  the logic. (src/billing.ts)
```

It warns; it does not block. Turn it off with `fenceEnabled` in `.persist/config.json`.

## How agents load the memory

Writing memory only helps if the agent reads it, so `persist init` wires each tool with its own
native mechanism:

| Tool            | How memory loads                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Claude Code** | `CLAUDE.md` (auto) imports `AGENTS.md`; a SessionStart hook injects a live map of accepted ADRs and modules every session. |
| **Cursor**      | `.cursor/rules/persist-memory.mdc` is an always-apply rule that loads the memory rules into every request.                 |
| **Codex**       | `AGENTS.md` is auto-discovered and loaded.                                                                                 |

The portable guarantee across every tool is `AGENTS.md` plus the generated Agent Skills
(`.agents/skills/`). The dynamic per-session ADR/module map is a Claude Code bonus; the Cursor rule
and `AGENTS.md` carry the same rules everywhere else.

Three workflow skills ship in the catalog (`plan-feature`, `security-review`,
`conventions-adherence`); each states when it activates and what it returns. One skill ships an
executable helper (`security-review/scripts/scan-secrets.sh`): it is read-only and local,
`persist init` names every executable file it writes, and deleting it degrades to the documented
prose path.

`AGENTS.md` leads with a short, imperative **Rules** block (read memory first, reuse the
conventions, record lessons, don't contradict accepted ADRs, run `persist doctor` before "done") —
and instructs the agent to keep `CONVENTIONS.md` and `LESSONS.md` current itself, so that memory
stays useful without anyone hand-writing it. The human just reviews the agent's edits in the pull
request.

## Repository Memory

Persist OS creates a memory structure under `docs/` and `.persist/config.json`, with an explicit
source-of-truth order:

```txt
1. Accepted ADRs and repository decisions     5. Module docs
2. Product memory (PRODUCT.md)                6. Feature plans
3. Engineering standards                      7. Task files
4. Security and testing docs                  8. External context
                                              9. Chat history
```

If external context or chat history conflicts with repository memory, **repository memory wins**.

### Putting memory somewhere other than `docs/`

If `docs/` is already taken, or you want the memory out of the way, move it and tell
`.persist/config.json` where it went. Four keys set the layout. Each is a path relative to the
repository root:

| Key           | Default            | What lives there                                   |
| ------------- | ------------------ | -------------------------------------------------- |
| `docsDir`     | `docs`             | The required docs, plus `60-engineering/FENCES.md` |
| `adrDir`      | `docs/adrs`        | ADRs and the ADR index (`README.md`)               |
| `modulesDir`  | `docs/30-modules`  | Module memory (opt-in)                             |
| `featuresDir` | `docs/40-features` | Feature plans (opt-in)                             |

`init` always writes the default layout, so relocate after it:

```bash
persist init
mv docs .memory
```

```jsonc
// .persist/config.json
{
  "docsDir": ".memory",
  "adrDir": ".memory/adrs",
  "modulesDir": ".memory/30-modules",
  "featuresDir": ".memory/40-features",
  // ...leave the other keys as they are
}
```

```bash
persist doctor   # should pass exactly as it did before the move
```

The four keys are independent. `adrDir` can be a top-level `decisions/` while everything else stays
under `docs/`. Inside `docsDir` the layout is fixed: the required docs stay at
`00-product/PRODUCT.md`, `60-engineering/CONVENTIONS.md` and so on, because doctor looks for them by
those names.

**What follows the config:** doctor, every `create` command, `adr accept` / `supersede`,
`fence add`, and the Claude SessionStart hook. The hook reads the config each time a session starts,
so moving the folder never means regenerating it.

**What doesn't:** the prose in `CLAUDE.md`, `AGENTS.md`, the Cursor rule and the generated skills
still says `docs/`. Those files are yours to edit, so update the paths in them after a move.

**Don't use `persist init --force --reinit` to refresh anything.** It rewrites every generated file,
filled-in docs included, and writes a fresh config with the default paths. After an upgrade or a
config edit, run `persist hooks sync` instead: it regenerates the hooks and nothing else. A plain
`persist init` (no `--force`) only adds files that are missing, which in a relocated repository
means the default `docs/` skeleton comes back, so skip it once you've moved.

## Local-First Guarantees

Persist OS does not:

- make network calls at runtime;
- collect telemetry;
- connect to MCP servers or call AI APIs;
- generate production application code;
- install dependencies into your repository;
- overwrite existing files by default.

## Examples

The exact memory `persist init` writes today is goldened in
`tests/golden/generated-minimal.test.ts`. The `examples/` directory holds generated output from the
retired preset era (0.5 and 0.6); it is kept for history and is not published with the package.

## Development

```bash
pnpm install
pnpm lint
pnpm format:check
pnpm test:run
pnpm typecheck
pnpm build
pnpm pack:check
```

Run the gates above and `persist doctor` before claiming work is complete. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow, and [SECURITY.md](SECURITY.md) for the
security model.

## Acknowledgments

The [landing page](https://persist-os.pages.dev) is deployed with
[Pagecast](https://github.com/Amal-David/pagecast) — thank you.

## License

MIT — see [LICENSE](LICENSE).
