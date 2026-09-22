# Persist OS

Memory for AI coding agents that lives in your repository, and a `doctor` that checks it stays true.

[![npm](https://img.shields.io/npm/v/persist-os)](https://www.npmjs.com/package/persist-os)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)

Persist is a local CLI. It writes your decisions, rules, and lessons into plain Markdown in the
repo, loads them into Claude Code, Codex, and Cursor, and checks on every commit that the memory
still matches the code.

[Website](https://persist-os.pages.dev) · [Docs](https://persist-os.pages.dev/docs/) ·
[Why I built this](PHILOSOPHY.md) · [Contributing](CONTRIBUTING.md)

![Persist OS: creating repository memory, the Chesterton fence catching an unexplained change, recording the reason, and that reason coming back on the next run](https://raw.githubusercontent.com/Karthick-Ramachandran/persist-os/main/docs/media/persist-1.1.gif)

```bash
npx persist-os@latest init
```

## Why

An agent starts every session knowing nothing about your project. It doesn't know you decided to
store money as integer cents, that the odd ordering in `split.ts` is deliberate, or how the last
change to billing went wrong. You can write all of that in a `CLAUDE.md`, and agents will read it.
Nobody finds out when that file goes stale, though. Teammates on Codex or Cursor never see it, and a
decision edited in place loses its history.

Persist keeps that knowledge in the repository, reviewed in pull requests like code, and checks it
on every commit.

## What it does

### Decisions agents follow

`persist adr create` records a decision and `persist adr accept` makes it binding. Give an ADR the
paths it governs, and doctor names it, with the decision itself, whenever a change touches those
files. The `adr-compliance` skill then has the agent check its diff against the decision line by
line. When a decision changes, `persist adr supersede` marks the old one and flags any memory that
still cites it.

### Why odd code is odd

Some code looks wrong on purpose. When a commit touches source with no recorded reason, doctor asks
why. You answer once:

```sh
persist fence add src/billing.ts \
  --why "Four writes are deliberate: the ledger and the audit trail land in one transaction."
```

From then on, every session gets that reason before anyone "simplifies" the code.

### The right place to start

A context card is a short file for one area of the code: what it's for, the tasks it covers in plain
words, the files to open first, and the rules that apply there. When you give an agent a task,
Persist matches it against the cards and tells the agent where to start. In Claude Code and Codex
that happens through a prompt hook; other tools run `persist context "<task>"` from a skill.
Matching is keyword search, with no model involved, and every result shows the words it matched.
Agents add to the cards as they finish work, so matches improve with use.

### A check on every commit

`persist doctor` runs 19 deterministic checks and returns an exit code. It catches memory that
points at deleted files, docs that cite a replaced decision, notes that went stale while the code
moved on, and work marked done without test evidence. When a check can't run, it reports "not
evaluated" with the reason instead of passing. `init` also switches on git hooks: doctor runs before
each commit and your tests run before each push.

## Everything it does

| Feature                         | What it does for you                                                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Remembering**                 |                                                                                                                                                     |
| Six-document memory             | `init` writes product, security, quality, standards, conventions, and lessons docs. Nothing else is required.                                       |
| Decision records                | `adr create`, `accept`, and `supersede` keep every decision and the reason it changed.                                                              |
| Chesterton fences               | `fence add` records why odd-looking code is shaped that way, in a person's words.                                                                   |
| Context cards                   | `context add` gives each area of the code a card: what it's for, what tasks it covers, where to start.                                              |
| Conventions and lessons         | Agents reuse the helpers you've listed and avoid mistakes already recorded. They keep both files current.                                           |
| Existing codebases              | `adopt` reads your manifests and proposes decisions. Nothing is accepted until you agree.                                                           |
| MCP context                     | `mcp add` saves what an MCP server knows as reviewable files, offline.                                                                              |
| **Getting it to the agent**     |                                                                                                                                                     |
| One set of rules for every tool | `AGENTS.md` holds the rules. `CLAUDE.md` imports it, Cursor gets an always-on rule, and Codex reads it directly.                                    |
| Session start map               | Each Claude Code session opens with the accepted decisions, modules, and fence reasons.                                                             |
| Task lookup                     | A prompt hook in Claude Code and Codex matches your task against the context cards and adds where to start.                                         |
| Workflow skills                 | Twelve skills: tasks, tests, decisions, drift review, reports, module and feature plans, security, conventions, fences, ADR checks, context lookup. |
| **Keeping agents honest**       |                                                                                                                                                     |
| Governing decisions             | Changing a file names the ADR that governs it, with the decision itself.                                                                            |
| ADR compliance                  | The agent checks its diff against each governing decision, quoting the lines.                                                                       |
| Definition of done              | Agents are told work is done only when doctor passes and the tests pass.                                                                            |
| **Checking**                    |                                                                                                                                                     |
| Doctor                          | 19 checks: missing files, broken links, decisions cited after they were replaced, stale memory, dead card paths, work marked done without evidence. |
| Honest results                  | A check that can't run says "not evaluated" and why, and it never counts that as a pass.                                                            |
| Git hooks                       | Doctor runs before each commit and your tests before each push. `init` switches them on; they fall back to `npx` if Persist isn't installed.        |
| Team checks                     | Doctor warns when memory is git-ignored, when a clone has hooks off, and when always-loaded memory grows past 24 KB.                                |
| CI                              | `init` writes a GitHub Actions workflow, and `doctor --json` gives CI a machine-readable report.                                                    |
| **Fitting in**                  |                                                                                                                                                     |
| Your layout                     | Move the memory out of `docs/` by setting four paths in the config.                                                                                 |
| Safe by default                 | Persist never overwrites a file you have. `hooks sync` refreshes hooks without touching docs or config.                                             |
| Local only                      | No network calls, no telemetry, and no AI API. It runs on your machine and doesn't choose your framework, database, or architecture.                |

## What it writes

```txt
your-repo/
├── AGENTS.md                         # rules every agent reads
├── CLAUDE.md                         # one line: @AGENTS.md
├── docs/
│   ├── 00-product/PRODUCT.md         # what this is, and what it isn't
│   ├── 20-security/SECURITY_MODEL.md
│   ├── 50-quality/QUALITY_GATES.md
│   ├── 60-engineering/
│   │   ├── ENGINEERING_STANDARDS.md
│   │   ├── CONVENTIONS.md            # helpers and patterns to reuse
│   │   └── LESSONS.md                # what broke, and why
│   ├── adrs/                         # decisions
│   └── context/                      # context cards, added as you work
├── .claude/skills/, .agents/skills/  # workflow skills, loaded when needed
├── .persist/hooks/                   # doctor at commit, tests at push
└── .github/workflows/persist.yml
```

Six documents and a decision log are all that's required. Everything else grows as you work. The
folder can live somewhere other than `docs/`; see
[memory layout](https://persist-os.pages.dev/docs/memory).

## Get started

```bash
npx persist-os@latest init                          # six questions, then the minimum files
npx persist-os adr create "Store money as integer cents"
npx persist-os doctor
```

Install it globally with `npm install -g persist-os` to type `persist` instead. Node 20 or newer.

For an existing codebase, `persist adopt` reads your manifests and proposes decisions; nothing is
accepted until you say so. Every command prints what it wrote and what to do next. The full list is
in [Commands](https://persist-os.pages.dev/docs/commands).

## Documentation

- [Commands](https://persist-os.pages.dev/docs/commands)
- [What doctor checks](https://persist-os.pages.dev/docs/doctor)
- [Decisions](https://persist-os.pages.dev/docs/decisions)
- [Hooks, test gate, and CI](https://persist-os.pages.dev/docs/hooks)
- [Memory layout and loading](https://persist-os.pages.dev/docs/memory)

## Development

```bash
pnpm install
pnpm test:run && pnpm typecheck && pnpm lint && pnpm build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and [SECURITY.md](SECURITY.md) for the
security model.

## Acknowledgments

The [website](https://persist-os.pages.dev) is deployed with
[Pagecast](https://github.com/Amal-David/pagecast).

## License

MIT. See [LICENSE](LICENSE).
