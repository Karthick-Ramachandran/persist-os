# Recall OS

**Durable, AI-ready engineering memory for your repository — and a deterministic `doctor` that
proves it stays healthy.**

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![Local-first](https://img.shields.io/badge/local--first-yes-success)
![Telemetry](https://img.shields.io/badge/telemetry-none-success)
![Network](https://img.shields.io/badge/network%20calls-none-success)

Recall OS is a local-first CLI that turns a repository into the source of truth for **why** it is
built the way it is. It creates structured, reviewable memory — product intent, architecture
decisions, module ownership, testing and security expectations, AI agent rules — and then
**validates** that memory with `recall doctor`. Architecture-neutral. No network, no telemetry, no
code generation.

[Website](https://recall-os.pages.dev) · [Install](#install) · [Quickstart](#quickstart) ·
[Commands](#commands) · [What Doctor Checks](#what-doctor-checks) · [Presets](#presets) ·
[Why I built this](PHILOSOPHY.md) · [Contributing](CONTRIBUTING.md)

![Recall OS — guided memory creation, ADR acceptance, and the doctor gate](https://raw.githubusercontent.com/Karthick-Ramachandran/recall-os/main/docs/media/recall-demo.gif)

---

AI can write code fast, but its context is temporary — it forgets decisions, compacts conversations,
and drifts from earlier intent. Git records **what** changed. Recall OS records **why**, in a form
humans and agents can re-read and validate before and after work.

```txt
What are we building?   Why did we decide this?
What must not drift?    What evidence proves this work is complete?
```

When these questions live in the repository instead of a chat window, the repository can answer
them.

> **Not a vector memory engine.** Tools like supermemory or mem0 _retrieve_ information with
> embeddings; Recall OS writes the **decisions** themselves — reviewable files, not vectors — and
> checks they stay consistent. They're complementary, not competitors. →
> [Why I built this](PHILOSOPHY.md)

## Why Recall OS

- **Memory that outlives the conversation.** Decisions, constraints, and ownership are committed to
  the repo, not trapped in an agent's context window.
- **A gate, not just docs.** `recall doctor` is deterministic and returns an exit code, so "is this
  work actually finished and consistent?" becomes a check you can run in a hook or CI.
- **Decisions change safely.** When a decision changes, `recall adr supersede` records it (the old
  ADR is marked superseded, the new one links back) and Doctor flags any memory still citing the old
  one — so the trail stays auditable instead of silently contradicted. The generated agent rules
  even carry the CLI commands inline, so your AI tool uses them itself.
- **Architecture-neutral by design.** Recall OS records and protects _your_ decisions. It never
  silently picks a framework, database, or pattern for you.
- **Local-first and private.** No network calls, no telemetry, no AI API calls, no remote templates.
  It runs entirely on your machine.
- **Safe by default.** Non-destructive writes, path-traversal and symlink protection, and a refusal
  to overwrite an existing installation without explicit intent.

## Install

Run it without installing — the quickest way to try it:

```bash
npx recall-os@latest init
```

Every command works the same way: `npx recall-os <command>` (e.g. `npx recall-os doctor`).

Or install the CLI globally:

```bash
npm install -g recall-os
recall --help
```

(Requires Node.js >= 20. Published at
[npmjs.com/package/recall-os](https://www.npmjs.com/package/recall-os).)

## Quickstart

```bash
# 1. Create repository memory (architecture-neutral, or pick an opinion pack)
recall init
recall init --preset kotlin-android   # optional, proposes stack decisions

# 2. Capture intent and decisions as you work
recall feature create checkout
recall adr create payment-provider
recall adr accept payment-provider    # promote a proposal to accepted memory

# 3. Bring an MCP server's context into durable memory (offline)
recall mcp add figma

# 4. Validate the memory is healthy and complete
recall doctor
```

Every command guides you — it names the file it created, where it is, and what to do next.

Generate files only for the AI tools you use: `recall init --ai-tools claude,cursor` (default: all
of `claude`, `codex`, `cursor`; `AGENTS.md` is always written).

`recall init` also generates a tracked pre-commit hook at `.recall/hooks/pre-commit` that runs
`recall doctor` plus any gates you configure. Enable it once per clone — Recall OS proposes the
command but never runs it for you:

```bash
git config core.hooksPath .recall/hooks
```

## Commands

| Command                            | Purpose                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| `recall init`                      | Create neutral repository memory (and a pre-commit hook).                      |
| `recall init --preset <id>`        | Add an opinion pack: rich guidance and proposed ADRs.                          |
| `recall init --ai-tools <list>`    | Generate files only for the AI tools you use (claude, codex, cursor, generic). |
| `recall adopt`                     | Inspect an existing repo and propose reviewable memory.                        |
| `recall preset list`               | List built-in presets.                                                         |
| `recall feature create <name>`     | Scaffold feature memory (PRD, acceptance, tests, review).                      |
| `recall adr create <title>`        | Create a proposed architecture decision record.                                |
| `recall adr accept <name>`         | Promote a proposed ADR to accepted source-of-truth.                            |
| `recall adr supersede <old> <new>` | Record a changed decision: mark the old ADR superseded by a new accepted ADR.  |
| `recall module create <name>`      | Scaffold module memory (ownership, boundaries, tests).                         |
| `recall skill create <name>`       | Generate a portable AI agent skill (Claude + Agent Skills).                    |
| `recall skill list`                | List the built-in agent skill catalog.                                         |
| `recall mcp add <server>`          | Generate offline, proposed memory for an MCP server.                           |
| `recall doctor`                    | Validate memory health, evidence, and drift.                                   |

## What Doctor Checks

`recall doctor` is the part that makes Recall OS more than a template. Every check is deterministic,
local, and read-only.

| Category            | Detects                                                                                 | Severity     |
| ------------------- | --------------------------------------------------------------------------------------- | ------------ |
| Structure           | Missing config, required docs, or feature / module / ADR sections                       | error        |
| Completion evidence | A feature marked complete with review pending or no test / result evidence              | error        |
| ADR quality         | An accepted ADR with no meaningful consequences                                         | error / warn |
| Security            | A security-sensitive feature with no documented security impact                         | error / warn |
| Drift               | Memory that references a missing, or not-yet-accepted, ADR                              | error / warn |
| Superseded          | Memory still citing a decision that has been superseded by a newer ADR                  | warning      |
| Content             | A feature PRD, module, or (once work exists) the threat / security model left as a stub | warning      |

```txt
Exit codes:  0 = healthy   1 = warnings only   2 = errors
```

Because it returns an exit code, Doctor drops straight into the completion loop:

```bash
pnpm test:run && pnpm typecheck && recall doctor
```

Use it locally via the generated pre-commit hook, or add `recall doctor` as a step in CI.

## Presets

Presets are opinion packs. They ship **proposed** guidance and proposed ADRs for a stack's real
decision forks — and they can never silently accept a choice for you (the schema enforces `Proposed`
status on every preset decision).

| Preset           | Stack            | Proposes (always as proposed ADRs)                                                  |
| ---------------- | ---------------- | ----------------------------------------------------------------------------------- |
| `laravel-react`  | Laravel + React  | Laravel, Inertia + React, Eloquent, Sanctum, Form Requests + Policies, queues, Pest |
| `laravel-vue`    | Laravel + Vue    | Laravel, Inertia + Vue, Eloquent, Sanctum, Form Requests + Policies, queues, Pest   |
| `laravel-api`    | Laravel (API)    | Laravel, versioned REST + API Resources, Eloquent, Sanctum, queues, Pest            |
| `kotlin-android` | Kotlin / Android | Compose, Coroutines + Flow, Hilt, Room, MVVM                                        |
| `python-fastapi` | Python / FastAPI | FastAPI, PostgreSQL + SQLAlchemy, Pydantic, pytest, Redis                           |
| `ios-swift`      | iOS / Swift      | SwiftUI, async/await + Observation, SwiftData, MVVM                                 |
| `nextjs`         | Next.js / TS     | App Router, typed data layer, Tailwind, Vitest + Playwright                         |
| `flutter`        | Flutter          | Platform and state-management guidance                                              |
| `generic`        | none             | Architecture-neutral memory                                                         |

Adding a preset is a small contribution — see [CONTRIBUTING.md](CONTRIBUTING.md).

## How It Works

![How Recall OS works: you capture intent, decisions, ownership, standards, and security with recall init / feature / adr / module; it writes durable, reviewable memory under docs/ and .recall/config.json that humans review in pull requests and agents re-read every session; recall doctor validates it deterministically, returning exit code 0, 1, or 2 for a pre-commit hook or CI gate.](https://raw.githubusercontent.com/Karthick-Ramachandran/recall-os/main/docs/media/how-it-works.png)

## How agents load the memory

Writing memory only helps if the agent reads it, so `recall init` wires each tool with its own
native mechanism:

| Tool            | How memory loads                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Claude Code** | `CLAUDE.md` (auto) imports `AGENTS.md`; a SessionStart hook injects a live map of accepted ADRs and modules every session. |
| **Cursor**      | `.cursor/rules/recall-memory.mdc` is an always-apply rule that loads the memory rules into every request.                  |
| **Codex**       | `AGENTS.md` is auto-discovered and loaded.                                                                                 |

The portable guarantee across every tool is `AGENTS.md` plus the generated Agent Skills
(`.agents/skills/`). The dynamic per-session ADR/module map is a Claude Code bonus; the Cursor rule
and `AGENTS.md` carry the same rules everywhere else.

## Repository Memory

Recall OS creates a memory structure under `docs/` and `.recall/config.json`, with an explicit
source-of-truth order:

```txt
1. Accepted ADRs and repository decisions     6. Module docs
2. Architecture docs                          7. Feature plans
3. Engineering standards                      8. Task files
4. Current PRD and accepted changes           9. External context
5. Security and testing docs                 10. Chat history
```

If external context or chat history conflicts with repository memory, **repository memory wins**.

## Local-First Guarantees

Recall OS does not:

- make network calls at runtime;
- collect telemetry;
- connect to MCP servers or call AI APIs;
- generate production application code;
- install dependencies into your repository;
- overwrite existing files by default.

## Examples

Committed sample outputs show the exact memory each preset generates:

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

Run the gates above and `recall doctor` before claiming work is complete. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow and how to add a preset, and
[SECURITY.md](SECURITY.md) for the security model.

## Acknowledgments

The [landing page](https://recall-os.pages.dev) is deployed with
[Pagecast](https://github.com/Amal-David/pagecast) — thank you.

## License

MIT — see [LICENSE](LICENSE).
