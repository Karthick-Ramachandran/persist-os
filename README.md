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
[Commands](#commands) · [What Doctor Checks](#what-doctor-checks) · [Presets](#presets) ·
[Why I built this](PHILOSOPHY.md) · [Contributing](CONTRIBUTING.md)

![Persist OS — guided memory creation, ADR acceptance, and the doctor gate](https://raw.githubusercontent.com/Karthick-Ramachandran/persist-os/main/docs/media/persist-demo.gif)

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
| `persist init`                      | Create neutral repository memory (and a pre-commit hook).                      |
| `persist init --ai-tools <list>`    | Generate files only for the AI tools you use (claude, codex, cursor, generic). |
| `persist init --features --modules` | Also generate the opt-in feature/module workflow scaffolding.                  |
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

## What Doctor Checks

`persist doctor` is the part that makes Persist OS more than a template. Every check is
deterministic, local, and read-only.

| Category            | Detects                                                                                     | Severity     |
| ------------------- | ------------------------------------------------------------------------------------------- | ------------ |
| Structure           | Missing config, required docs, or feature / module / ADR sections                           | error        |
| Completion evidence | A feature marked complete with review pending or no test / result evidence                  | error        |
| ADR quality         | An accepted ADR with no meaningful consequences                                             | error / warn |
| Security            | A security-sensitive feature with no documented security impact                             | error / warn |
| Drift               | Memory that references a missing, or not-yet-accepted, ADR                                  | error / warn |
| Superseded          | Memory still citing a decision that has been superseded by a newer ADR                      | warning      |
| Staleness           | Memory citing `src/` code that changed long after the memory did (git-based; off-git skips) | warning      |
| Context budget      | The always-loaded agent files (CLAUDE.md + AGENTS.md + Cursor rule) grown past a budget     | warning      |
| Content             | A feature PRD, module, or (once work exists) the threat / security model left as a stub     | warning      |
| Conventions         | The canonical-vocabulary doc left as a stub once the repository has real work               | warning      |

```txt
Exit codes:  0 = healthy   1 = warnings only   2 = errors
```

Because it returns an exit code, Doctor drops straight into the completion loop:

```bash
pnpm test:run && pnpm typecheck && persist doctor
```

Use it locally via the generated pre-commit hook, or add `persist doctor` as a step in CI. Add
`--json` (`persist doctor --json`) for a stable, machine-readable report — handy for CI artifacts,
hooks, and agent handoffs.

## Opt-In Memory

`persist init` generates the minimal set by default: six documents plus the ADR directory. Feature
and module workflow memory is opt-in — pass `persist init --features --modules`, or run
`persist feature create` / `persist module create` whenever you need them. Doctor treats absent
opt-in memory as not-evaluated (with a reason), never as an error.

## How It Works

![How Persist OS works: you capture intent, decisions, ownership, standards, and security with persist init / feature / adr / module; it writes durable, reviewable memory under docs/ and .persist/config.json that humans review in pull requests and agents re-read every session; persist doctor validates it deterministically, returning exit code 0, 1, or 2 for a pre-commit hook or CI gate.](https://raw.githubusercontent.com/Karthick-Ramachandran/persist-os/main/docs/media/how-it-works.svg)

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

## Local-First Guarantees

Persist OS does not:

- make network calls at runtime;
- collect telemetry;
- connect to MCP servers or call AI APIs;
- generate production application code;
- install dependencies into your repository;
- overwrite existing files by default.

## Examples

Committed sample outputs show generated memory from the preset era (historical — the current shape
is goldened in `tests/golden/generated-minimal.test.ts`):

```txt
examples/generated-generic/         examples/generated-kotlin-android/
examples/generated-nextjs/          examples/generated-python-fastapi/
examples/generated-ios-swift/       examples/generated-flutter/
examples/generated-laravel-react/   examples/generated-laravel-vue/
examples/generated-laravel-api/
```

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
[CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow and how to add a preset, and
[SECURITY.md](SECURITY.md) for the security model.

## Acknowledgments

The [landing page](https://persist-os.pages.dev) is deployed with
[Pagecast](https://github.com/Amal-David/pagecast) — thank you.

## License

MIT — see [LICENSE](LICENSE).
