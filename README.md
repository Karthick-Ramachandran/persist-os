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

[Install](#install) · [Quickstart](#quickstart) · [Commands](#commands) ·
[What Doctor Checks](#what-doctor-checks) · [Presets](#presets) · [Contributing](CONTRIBUTING.md)

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

## Why Recall OS

- **Memory that outlives the conversation.** Decisions, constraints, and ownership are committed to
  the repo, not trapped in an agent's context window.
- **A gate, not just docs.** `recall doctor` is deterministic and returns an exit code, so "is this
  work actually finished and consistent?" becomes a check you can run in a hook or CI.
- **Architecture-neutral by design.** Recall OS records and protects _your_ decisions. It never
  silently picks a framework, database, or pattern for you.
- **Local-first and private.** No network calls, no telemetry, no AI API calls, no remote templates.
  It runs entirely on your machine.
- **Safe by default.** Non-destructive writes, path-traversal and symlink protection, and a refusal
  to overwrite an existing installation without explicit intent.

## Install

```bash
# Local development
pnpm install
pnpm build
node dist/cli.js --help
```

```bash
# Once published to npm
npm install -g recall-os
```

## Quickstart

```bash
# 1. Create repository memory (architecture-neutral, or pick an opinion pack)
recall init
recall init --preset kotlin-android   # optional, proposes stack decisions

# 2. Capture intent and decisions as you work
recall feature create checkout
recall adr create payment-provider
recall module create billing

# 3. Validate the memory is healthy and complete
recall doctor
```

`recall init` also generates a tracked pre-commit hook at `.recall/hooks/pre-commit` that runs
`recall doctor` plus any gates you configure. Enable it once per clone — Recall OS proposes the
command but never runs it for you:

```bash
git config core.hooksPath .recall/hooks
```

## Commands

| Command                        | Purpose                                                   |
| ------------------------------ | --------------------------------------------------------- |
| `recall init`                  | Create neutral repository memory (and a pre-commit hook). |
| `recall init --preset <id>`    | Add an opinion pack: rich guidance and proposed ADRs.     |
| `recall adopt`                 | Inspect an existing repo and propose reviewable memory.   |
| `recall preset list`           | List built-in presets.                                    |
| `recall feature create <name>` | Scaffold feature memory (PRD, acceptance, tests, review). |
| `recall adr create <title>`    | Create a proposed architecture decision record.           |
| `recall module create <name>`  | Scaffold module memory (ownership, boundaries, tests).    |
| `recall doctor`                | Validate memory health, evidence, and drift.              |

## What Doctor Checks

`recall doctor` is the part that makes Recall OS more than a template. Every check is deterministic,
local, and read-only.

| Category            | Detects                                                                    | Severity     |
| ------------------- | -------------------------------------------------------------------------- | ------------ |
| Structure           | Missing config, required docs, or feature / module / ADR sections          | error        |
| Completion evidence | A feature marked complete with review pending or no test / result evidence | error        |
| ADR quality         | An accepted ADR with no meaningful consequences                            | error / warn |
| Security            | A security-sensitive feature with no documented security impact            | error / warn |
| Drift               | Memory that references a missing, or not-yet-accepted, ADR                 | error / warn |
| Content             | A feature PRD still left as an unfilled template                           | warning      |

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

| Preset           | Stack            | Proposes (always as proposed ADRs)                          |
| ---------------- | ---------------- | ----------------------------------------------------------- |
| `kotlin-android` | Kotlin / Android | Compose, Coroutines + Flow, Hilt, Room, MVVM                |
| `python-fastapi` | Python / FastAPI | FastAPI, PostgreSQL + SQLAlchemy, Pydantic, pytest, Redis   |
| `ios-swift`      | iOS / Swift      | SwiftUI, async/await + Observation, SwiftData, MVVM         |
| `nextjs`         | Next.js / TS     | App Router, typed data layer, Tailwind, Vitest + Playwright |
| `flutter`        | Flutter          | Platform and state-management guidance                      |
| `generic`        | none             | Architecture-neutral memory                                 |

Adding a preset is a small contribution — see [CONTRIBUTING.md](CONTRIBUTING.md).

## How It Works

```txt
                Recall OS creates and validates memory under docs/ and .recall/

  intent ─┐
  decisions ─┤        recall init / feature / adr / module        ┌─ humans review
  ownership ─┼──────────────────────────────────────────────────►│
  standards ─┤              docs/ + .recall/config.json           └─ agents re-read
  security ─┘                          │
                                       ▼
                                 recall doctor  ──►  0 / 1 / 2  ──►  hook or CI gate
```

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
examples/generated-generic/        examples/generated-kotlin-android/
examples/generated-nextjs/         examples/generated-python-fastapi/
examples/generated-ios-swift/      examples/generated-flutter/
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

## License

MIT — see [LICENSE](LICENSE).
