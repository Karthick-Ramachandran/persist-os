# Contributing to Recall OS

Thanks for your interest in Recall OS. This project is a local-first CLI that creates and validates
AI-ready repository memory. It is architecture-neutral: it records, distributes, validates, and
protects decisions, and it does not make architecture choices for users.

Please read the philosophy in `README.md` and the standards in
`docs/60-engineering/ENGINEERING_STANDARDS.md` before contributing.

## Development Setup

```bash
pnpm install
pnpm build
node dist/cli.js --help
```

## The Completion Gate

Before opening a pull request, run every gate and make sure it passes:

```bash
pnpm test:run
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
pnpm pack:check
node dist/cli.js doctor
```

Do not claim a change is complete without listing the files changed, the commands run, the results,
any skipped checks, and remaining risks. This is the same evidence standard the tool itself enforces.

## How Work Is Structured

Non-trivial changes follow a mini product workflow, mirrored in `docs/40-features/F-###-<name>/`:

```txt
PRD -> Acceptance -> Architecture Impact -> Test Plan -> Tasks
    -> Implementation -> Completion Report -> Review
```

Meaningful architecture, security, dependency, or file-write decisions need an ADR under
`docs/adrs/`. Repository rules override model and contributor preferences; if a request conflicts
with accepted repository memory, stop and report the conflict.

## Adding a Preset

Presets are opinion packs. They may propose choices, never silently accept them. The preset schema
enforces this: every preset decision must use `status: "proposed"`.

Read `docs/10-architecture/OPINION_PACKS.md` for the full content standard, then:

1. Create `src/presets/<id>/preset.ts` exporting a `Preset`.
2. Follow the opinionated-preset content standard:
   - a rich guidance template at `docs/ai/presets/<id>-guidance.md`, framed as proposed, naming the
     stack's real decision forks (UI, concurrency, persistence, data layer or DI, testing);
   - at least four proposed ADRs at `docs/adrs/proposed/ADR-PROPOSED-<id>-<topic>.md`, each with
     Status, Context, Decision, Alternatives, and Consequences, all `Proposed`.
3. Register the preset in `src/core/presets/preset-registry.ts`.
4. Add a unit test (see `tests/unit/presets/opinionated-presets.test.ts`) and a golden test
   (see `tests/golden/generated-*.test.ts`).
5. Add an example under `examples/generated-<id>/` by running
   `recall init --preset <id>` inside that folder, plus a short `README.md`. To regenerate an
   existing example folder, use `recall init --preset <id> --force --reinit`.
6. Run the completion gate.

Use the existing `kotlin-android` and `python-fastapi` presets as references.

> Run `recall init` only inside an empty target folder or an existing example folder. Running it in
> the repository root will overwrite this repository's own memory.

## Commit And Branch Hygiene

- Keep changes scoped to the task.
- Branch off `main`; do not force-push shared branches.
- Do not use destructive git commands without explicit approval.
- Do not commit secrets, `.env` contents, or credentials.

## Security

Report security issues privately. See `SECURITY.md`.
