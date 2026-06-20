# Recall OS

Recall OS is a local-first CLI for creating and maintaining repository memory for AI-assisted
software work.

It does not generate application code. It gives a repository durable memory: product intent,
architecture decisions, module ownership, testing expectations, engineering standards, AI
instructions, and health checks.

Core promise:

```txt
AI can write the code.
Recall OS makes sure the repository does not forget what it is doing.
```

Simple explanation:

```txt
Git tracks what changed.
Recall OS tracks why it changed.
```

## Why It Exists

AI coding tools are useful, but their context is temporary. Repositories need a stable source of
truth that humans and agents can re-read, review, and validate.

Recall OS treats the repository as the authority. Agents are executors. Accepted repository memory
wins over model preference and chat history.

Recall OS is not an AI coding agent, app generator, architecture generator, framework generator, IDE
competitor, agent runtime, or model hosting platform.

## Install

P10 prepares the package for release but does not publish it to npm.

After publishing, the intended install command is:

```bash
npm install -g recall-os
```

During local development:

```bash
pnpm install
pnpm build
node dist/cli.js --help
```

## Quickstart

Initialize repository memory in an empty folder:

```bash
mkdir my-app
cd my-app
recall init
```

Create feature, decision, and module memory:

```bash
recall feature create auth
recall adr create auth-strategy
recall module create auth
```

Check whether the repository memory is healthy enough for AI-assisted work:

```bash
recall doctor
```

`recall init` also generates a tracked pre-commit hook at `.recall/hooks/pre-commit` that runs
`recall doctor` plus any `preCommitGates` you configure. Enable it once per clone:

```bash
git config core.hooksPath .recall/hooks
```

Recall OS proposes this command but never runs it for you.

## Commands

| Command                        | Purpose                                                 |
| ------------------------------ | ------------------------------------------------------- |
| `recall init`                  | Create neutral repository memory.                       |
| `recall init --preset <id>`    | Add optional preset guidance and proposed decisions.    |
| `recall preset list`           | List built-in presets.                                  |
| `recall feature create <name>` | Create feature memory docs.                             |
| `recall adr create <title>`    | Create a proposed ADR.                                  |
| `recall module create <name>`  | Create module memory docs.                              |
| `recall doctor`                | Validate repository memory health, evidence, and drift. |

## Presets

Presets are optional opinion packs. They can provide guidance and proposed decisions, but they do
not silently accept architecture choices.

Built-in presets:

- `generic`
- `nextjs` (opinionated)
- `ios-swift` (opinionated)
- `kotlin-android` (opinionated)
- `python-fastapi` (opinionated)
- `flutter`

Opinionated presets ship rich proposed guidance and several proposed ADRs covering the stack's real
decision forks. Every preset decision stays `Proposed` until a human accepts it.

Default `recall init` is architecture-neutral.

## Repository Memory

Recall OS creates a memory structure under `docs/` and `.recall/config.json`.

The default source-of-truth order is:

1. Accepted ADRs and repository decisions
2. Architecture docs
3. Engineering standards
4. Current PRD and accepted change requests
5. Security and testing docs
6. Module docs
7. Feature plans
8. Task files
9. External context
10. Chat history

If external context or chat history conflicts with repository memory, repository memory wins.

## Product Direction

Recall OS grows in layers:

1. Create repository memory.
2. Validate memory with Doctor.
3. Make Doctor part of the AI completion gate.
4. Detect drift from accepted repository memory (first deterministic checks shipped: ADR reference
   integrity).
5. Distribute context across AI tools.
6. Make engineering standards increasingly checkable.
7. Adopt memory from legacy repositories without silently accepting inferred decisions.
8. Support organization memory across repositories.

The long-term moat is memory, discipline, governance, decision tracking, and drift detection.

## Local-First Runtime

Recall OS MVP does not:

- Make network calls at runtime.
- Collect telemetry.
- Connect to MCP servers.
- Call AI APIs.
- Generate production application code.
- Install dependencies into target repositories.
- Overwrite existing files by default.

## Examples

Example generated outputs are committed under `examples/`:

- `examples/generated-generic/`
- `examples/generated-nextjs/`
- `examples/generated-ios-swift/`
- `examples/generated-kotlin-android/`
- `examples/generated-python-fastapi/`
- `examples/generated-flutter/`

These examples show the shape of repository memory created by `recall init`.

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

Before claiming implementation work is complete, run the test and quality gates listed above. Use
`recall doctor` once the CLI binary is built.

## Release Status

Recall OS is prepared for package release in P10. P10 does not publish to npm, create tags, or
require npm credentials.

Before any public publish, recheck package name ownership for `recall-os` and review the package
contents with:

```bash
pnpm build
pnpm pack:check
```
