# PRD: Persist OS

## 1. Product Requirements Document

## 1.1 Product Summary

Persist OS is a local-first open-source CLI that initializes and maintains AI-ready engineering
memory inside software repositories.

Persist OS is an Engineering Memory Operating System.

Core promise:

```txt
AI can write the code.
Persist OS makes sure the repository does not forget what it is doing.
```

Simple explanation:

```txt
Git tracks what changed.
Persist OS tracks why it changed.
```

Durable product vision lives in:

- `docs/00-product/PRODUCT_VISION.md`
- `docs/00-product/POSITIONING.md`
- `docs/00-product/ROADMAP.md`

It preserves product intent, architecture decisions, module ownership, testing requirements,
security assumptions, engineering standards, and operational discipline, and makes them durable,
reviewable, and AI-readable.

It generates and manages:

- AI agent instruction files
- Architecture docs
- ADR templates and ADR files
- Feature PRDs
- Acceptance criteria
- Architecture impact docs
- Change request docs
- Module memory docs
- Engineering standards docs
- Testing strategy docs
- Security and threat model docs
- Review checklists
- Architecture drift checklists
- Completion report templates
- Optional preset guidance

Persist OS should help humans and AI agents work from the same durable source of truth.

Persist OS is intentionally architecture-neutral.

Its role is not to determine what architecture a team should adopt.

Its role is to ensure that architecture decisions, regardless of their content, become durable,
reviewable, AI-readable repository memory.

---

## 1.2 Product Goals

### Goal 1: Initialize AI-ready repositories

A user should be able to run:

```bash
npx persist init
```

and receive a professional engineering memory structure.

### Goal 2: Support AI-agent workflows

Persist OS should generate files usable by:

- Claude Code
- Codex
- Cursor
- GitHub Copilot
- Generic AI coding agents

### Goal 3: Prevent architecture drift

Persist OS should make undocumented architecture change visible.

It should not prevent change.

It should require change to be documented through:

- Change requests
- PRD updates
- Architecture impact updates
- ADRs
- Module docs
- Test plans

### Goal 4: Make tests professional

Generated testing docs should help AI agents write meaningful tests.

Tests should derive from:

- Acceptance criteria
- Risk
- Security invariants
- Module boundaries
- Regression history

Not random happy-path examples.

### Goal 5: Dogfood itself

Persist OS’s own repository should use the same structure it generates.

The project should prove its own usefulness by using:

- PRD
- BRD
- ADRs
- module docs
- feature plans
- testing strategy
- security model
- architecture drift checks
- completion reports

---

## 1.3 Product Principles

## 1.3.1 Trust over magic

The CLI must be predictable.

No hidden overwrites. No network calls. No surprise code generation. No repo upload. No telemetry in
MVP.

## 1.3.2 Durable memory over perfect prompts

AI context is temporary.

Repo memory is durable.

## 1.3.3 Docs must be actionable

Generated docs should not be fake enterprise paperwork.

Each generated document should help either:

- A human make a decision
- An AI agent implement safely
- A reviewer catch problems
- A future contributor understand context

## 1.3.4 Human owns architecture

AI can draft plans, tests, ADRs, and reviews.

Humans own final product intent, architecture decisions, risk acceptance, and merge approval.

## 1.3.5 Architecture neutral core

Persist OS Core does not choose architecture.

It does not decide whether a repository should use Redis, Kafka, CloudWatch, Datadog, Supabase,
Firebase, Auth0, Okta, Postgres, MongoDB, CQRS, event sourcing, Clean Architecture, or feature-first
architecture.

Those choices may enter the repository through accepted repository decisions, organization memory,
or optional presets.

Persist OS records, distributes, validates, and protects those decisions.

## 1.3.6 Change is allowed

Architecture drift is not “change.”

Architecture drift is undocumented change or mismatch with accepted repository memory.

Drift is not difference from a Persist OS recommendation.

If a decision changes and the docs are updated, that is evolution.

If code changes and docs remain stale, that is drift.

## 1.3.7 Repository memory first

Persist OS initializes repository memory, not application code.

Git initializes source control.

Persist OS initializes repository memory.

Code may come before or after Persist OS.

`persist init` must work in an empty folder and must not require a Flutter app, Next.js app, Swift
package, Android project, backend service, or any other existing framework.

---

## 1.4 Core Concepts

## 1.4.1 Engineering Memory

Engineering memory is the durable knowledge that lets a team or AI agent understand:

- What is being built
- Why it is built this way
- Which decisions already exist
- Which modules own what
- Which engineering standards must be followed
- What tests matter
- What security risks exist
- What changed recently
- What remains risky

## 1.4.2 Memory Engine

The Memory Engine is Persist OS Core.

It creates neutral structures for decisions, docs, review, testing, security, and drift detection.

It does not contain product infrastructure opinions.

## 1.4.3 Repository Decisions

Repository decisions are choices accepted by a repo owner or team.

Examples:

```txt
Use Supabase
Use Stripe
Use Next.js
Use internal IAM
```

Repository decisions become source of truth when they are accepted in ADRs or equivalent repository
memory.

## 1.4.4 Opinion Pack

Opinion pack is the architecture term for an optional preset.

The CLI term remains:

```txt
preset
```

Presets may provide starter guidance and proposed ADRs.

Presets must not silently create accepted architecture decisions.

## 1.4.5 Organization Memory

Organization memory captures standards imported or adopted from a company or team.

Examples:

```txt
Logging = Datadog
Queue = Kafka
Auth = Okta
Storage = S3
Observability = OpenTelemetry
```

Persist OS records organization memory so AI follows the team's decisions, not Persist OS's
preferences.

## 1.4.6 Engineering Standards Memory

Engineering Standards Memory records how work must be done in a repository.

It includes rules for secrets, dependencies, documentation, git hygiene, releases, migrations,
operations, code review, and AI agent behavior.

Repository rules override model preferences.

## 1.4.7 Repository Init

Repository init is the process of creating neutral repository memory.

It is not app scaffolding.

It is valid before app code exists.

Primary workflows:

```txt
Greenfield: empty folder -> persist init -> app/framework later
Existing repo: app exists -> persist init -> optional detected guidance later
Legacy adoption: mature repo -> future persist adopt
```

Git is recommended for normal development, but a Git repository must not be required for init.

Technology detection may suggest guidance or opinion packs. Detection must not become accepted
repository memory by itself.

## 1.4.8 ADR

ADR means Architecture Decision Record.

It records:

- Context
- Decision
- Alternatives
- Consequences
- Status
- Related documents

ADR statuses:

```txt
Proposed
Accepted
Rejected
Deprecated
Superseded
```

ADR is required when:

- Adding dependency
- Changing architecture style
- Changing auth provider
- Adding telemetry
- Adding network access
- Changing file write policy
- Changing module boundaries
- Supporting remote plugins/presets
- Changing security posture

## 1.4.9 RFC

RFC means Request for Comments.

RFC is used before major platform or community decisions.

ADR records final architecture decisions.

RFC proposes future project changes.

## 1.4.10 Module Memory

Each important module has:

```txt
MODULE.md
TASKS.md
TEST_PLAN.md
DECISIONS.md
```

Module docs help AI agents avoid rediscovering the same context repeatedly.

## 1.4.11 Change Request

When requirements change, a change request records:

- Previous behavior
- New behavior
- Reason
- Affected docs
- Architecture impact
- Required test updates
- Approval status

Example:

Google Auth changing to Microsoft Auth should create or update:

```txt
CHANGE_REQUESTS.md
PRD.md
ACCEPTANCE.md
ARCHITECTURE_IMPACT.md
ADR
MODULE.md
TEST_PLAN.md
TASKS.md
```

Without that, the code change becomes drift.

---

## 1.5 Source-of-Truth Hierarchy

When documents conflict, AI agents and humans should follow this order:

```txt
1. Accepted ADRs and repository decisions
2. Architecture docs
3. Engineering standards
4. Current PRD and accepted change requests
5. Security and testing docs
6. Module docs
7. Feature plans
8. Task files
9. MCP external context
10. Chat history
```

Chat history is never source of truth.

If documents conflict, the agent must stop and report the conflict.

---

## 1.6 MVP Commands

## 1.6.1 init

```bash
persist init
persist init --preset nextjs
persist init --preset ios-swift --ai claude,codex
persist init --mode standard
persist init --dry-run
persist init --force
```

Responsibilities:

- Create `.persist/config.json`
- Generate AI instruction files
- Generate neutral docs structure by default
- Generate selected preset guidance, when explicitly requested
- Generate selected AI tool files
- Skip existing files by default
- Print write summary

Semantics:

- `persist init` initializes repository memory.
- `persist init` must work in an empty folder.
- Existing app code is not required.
- Existing framework files are not required.
- A Git repository is optional, though recommended for normal development.
- `persist init` must not generate production application code.

---

## 1.6.2 feature create

```bash
persist feature create auth-provider
```

Creates:

```txt
docs/40-features/F-001-auth-provider/
  PRD.md
  ACCEPTANCE.md
  ARCHITECTURE_IMPACT.md
  CHANGE_REQUESTS.md
  PLAN.md
  TASKS.md
  TEST_PLAN.md
  REVIEW.md
  COMPLETION_REPORT.md
```

Rules:

- Feature name must be safe.
- Feature names are slugified.
- Path traversal is rejected.
- Existing feature folders are not overwritten by default.
- Feature number increments from existing features.

---

## 1.6.3 adr create

```bash
persist adr create auth-provider
```

Creates:

```txt
docs/adrs/ADR-0001-auth-provider.md
```

Rules:

- Find highest existing valid ADR number.
- Add one.
- Ignore malformed ADR filenames.
- Never reuse numbers automatically.
- Reject unsafe names.

---

## 1.6.4 module create

```bash
persist module create auth
```

Creates:

```txt
docs/30-modules/auth/
  MODULE.md
  TASKS.md
  TEST_PLAN.md
  DECISIONS.md
```

Rules:

- Reject unsafe names.
- Skip existing docs by default.
- Module names are slugified.

---

## 1.6.5 preset list

```bash
persist preset list
```

Shows available presets:

```txt
generic
nextjs
ios-swift
flutter
```

---

## 1.6.6 doctor

```bash
persist doctor
```

Checks repository health:

- Config exists
- Config is valid
- Required docs exist
- AI instruction files exist
- ADR directory exists
- Feature directory exists
- Module directory exists
- Quality docs exist
- Security docs exist
- Feature completion evidence exists when features are marked complete
- Review evidence exists when features are marked complete
- ADR consequence evidence exists
- Security-impact evidence exists for security-sensitive feature planning

Example output:

```txt
✓ Config found
✓ CLAUDE.md found
✓ AGENTS.md found
✓ Architecture docs found
⚠ No modules created yet
⚠ SECURITY_MODEL.md missing
```

---

## 1.7 MVP Supported Presets

Initial presets:

```txt
generic
nextjs
ios-swift
flutter
```

Future presets:

```txt
kotlin-android
react-native
expo
nestjs
django
rails
laravel
spring-boot
go
rust
sveltekit
```

The architecture should support more presets without rewriting command logic.

In architecture docs, presets are opinion packs.

Presets may provide starter guidance and proposed ADRs, but they must not silently create accepted
architecture decisions.

`persist init --preset flutter` means neutral repository memory plus Flutter-aware guidance and
proposed decisions.

Presets must not silently accept architecture, state management, backend, folder structure, vendor,
or infrastructure choices.

The default `persist init` path remains neutral and architecture-opinion-free.

---

## 1.8 MVP Supported AI Tool Targets

Initial AI tool targets:

```txt
claude
codex
cursor
generic
```

Generated files:

```txt
CLAUDE.md
AGENTS.md
.cursor/rules/*.mdc
docs/ai/
```

Future AI tool targets:

```txt
github-copilot
windsurf
cline
roo
gemini-cli
```

---

## 1.9 Modes

Persist OS should support generation modes.

## 1.9.1 Lite Mode

For solo builders who want minimal structure.

Generates:

```txt
CLAUDE.md
AGENTS.md
docs/10-architecture/ARCHITECTURE.md
docs/50-quality/DEFINITION_OF_DONE.md
docs/adrs/ADR_TEMPLATE.md
```

## 1.9.2 Standard Mode

Default mode.

Generates:

```txt
Lite
+ module docs
+ feature templates
+ test strategy
+ security model
+ drift checklist
+ AI review checklist
```

## 1.9.3 Strict Mode

For teams or serious projects.

Generates:

```txt
Standard
+ threat model
+ security test plan
+ release checklist
+ completion report template
+ change request workflow
+ stricter AI instructions
```

MVP may implement Standard first, but the config schema should support all three.

---

## 1.10 Configuration Manifest

Persist OS should create:

```txt
.persist/config.json
```

Example:

```json
{
  "version": "0.1.0",
  "templateVersion": "0.1.0",
  "preset": null,
  "memoryProfile": "standard",
  "aiTools": ["claude", "codex"],
  "docsDir": "docs",
  "featuresDir": "docs/40-features",
  "modulesDir": "docs/30-modules",
  "adrDir": "docs/adrs",
  "mode": "standard",
  "writePolicy": "skip-existing"
}
```

Requirements:

- Must be valid JSON.
- Must not include secrets.
- Must be validated with schema.
- Must track template version.
- Must support future upgrades.
- Must be read by every command.
- Must not require architecture IDs that imply Persist OS owns the user's architecture.
- P2 must not include decision indexes or organization standards.

---

## 1.11 File Write Policy

Default policy:

```txt
skip-existing
```

Supported policies:

```txt
skip-existing
overwrite
backup-and-write
fail-on-conflict
```

MVP must implement:

- skip existing
- dry run
- force overwrite

Rules:

- Never delete user files during init.
- Never overwrite without `--force`.
- Never write outside project root.
- Reject path traversal.
- Reject unsafe symlink writes by default.
- Never execute generated files.
- Never fetch remote templates in MVP.

---

## 1.12 Security Requirements

Persist OS is a local-first CLI.

Security promises:

- No telemetry in MVP
- No network calls in MVP
- No API keys
- No repo upload
- No reading `.env`
- No secret collection
- No dependency installation in user project
- No remote preset execution
- No hidden background process

Primary risks:

- Path traversal
- Symlink writes
- Unsafe overwrites
- Template injection
- Malicious preset definitions
- Supply chain vulnerabilities
- Accidental secret exposure

Required security tests:

- Reject `../../evil`
- Reject absolute output paths
- Reject null-byte input
- Reject empty names
- Reject reserved filenames where relevant
- Refuse symlink writes by default
- Skip existing files by default
- Ensure dry-run writes nothing
- Ensure no network calls exist in MVP

---

## 1.13 Testing Requirements

Testing must be professional and risk-based.

Test levels:

```txt
Unit tests
Integration tests
Golden output tests
Security tests
CLI behavior tests
Preset contract tests
E2E smoke tests
```

Unit tests should cover:

```txt
slugify
titleize
adrNumber
safePath
validatePreset
renderTemplate
createWritePlan
detectConflicts
```

Integration tests should cover:

```txt
init command
feature create command
adr create command
module create command
doctor command
existing repo behavior
dry-run behavior
force behavior
```

Golden tests should compare generated output for:

```txt
generic
nextjs
ios-swift
flutter
```

Security tests should cover malicious inputs and unsafe paths.

Test naming standard:

Good:

```txt
rejects path traversal in feature names
skips existing CLAUDE.md by default
creates next ADR number from highest existing ADR
```

Bad:

```txt
test init
works
test utils
```

Definition of done for tests:

- Core logic has unit tests.
- Command behavior has integration tests.
- Generated output has golden tests.
- File path inputs have security tests.
- Changed generated output updates snapshots intentionally.
- Completion report lists test commands and results.

---

## 1.14 Generated Documents

Persist OS should generate these docs.

```txt
docs/
  00-product/
    PRODUCT_VISION.md
    ROADMAP.md

  10-architecture/
    ARCHITECTURE.md
    TECH_STACK.md
    MODULE_BOUNDARIES.md
    DATA_FLOW.md
    PRESET_SYSTEM.md
    TEMPLATE_SYSTEM.md
    FILE_WRITE_POLICY.md
    ERROR_HANDLING.md
    DEPENDENCY_POLICY.md

  20-security/
    SECURITY_MODEL.md
    THREAT_MODEL.md
    SECURE_FILE_WRITES.md
    SUPPLY_CHAIN_SECURITY.md
    PRIVACY.md
    SECURITY_TEST_PLAN.md

  30-modules/
    MODULE_TEMPLATE.md

  40-features/
    FEATURE_TEMPLATE.md

  50-quality/
    TESTING_STRATEGY.md
    DEFINITION_OF_DONE.md
    CODE_REVIEW_CHECKLIST.md
    AI_REVIEW_CHECKLIST.md
    ARCHITECTURE_DRIFT_CHECKLIST.md
    RELEASE_CHECKLIST.md
    DOCUMENT_QUALITY_RUBRIC.md

  adrs/
    ADR_TEMPLATE.md

  rfcs/
    RFC_TEMPLATE.md
```

---

## 1.15 AI Skills

Persist OS should generate Claude-style skill files and equivalent guidance for other AI tools.

Suggested skills:

```txt
create-prd
plan-feature
create-adr
implement-task
write-tests
security-review
architecture-drift-review
update-module-memory
completion-report
```

Skill file structure:

```md
---
name: create-prd
description:
  Create a feature PRD with user stories, acceptance criteria, non-goals, security notes, testing
  expectations, and source-of-truth links.
---

# Skill: Create PRD

## Purpose

## Inputs

## Required Reading

## Output Files

## Process

## Stop Conditions

## Output Quality Bar
```

Skills should be focused.

Do not create giant knowledge dumps.

---

## 1.16 Plugin and Extension Model

Persist OS should be designed so others can extend it.

Future extensions may contribute:

- Presets / opinion packs
- AI tool targets
- Quality checklists
- Security templates
- Skills
- Workflow packs
- Doctor checks
- Generated examples

MVP should not implement external plugins, but internal architecture should be plugin-shaped.

Future directory model:

```txt
plugins/
  persist-plugin-android/
  persist-plugin-security/
  persist-plugin-enterprise/
```

Plugin safety rules:

- No remote execution in MVP.
- Future plugins must be declarative where possible.
- Plugin output paths must pass safe path validation.
- Plugin templates must pass schema validation.
- Plugin packages must not bypass write policy.

---

## 1.17 Preset Contribution Contract

Every preset must include:

- Preset name
- Scope and intended audience
- Proposed decisions, if any
- Required docs
- AI agent instructions
- Testing expectations
- Security expectations
- File output map
- Example generated output
- Golden tests
- README

No preset should be accepted without:

```txt
schema validation
golden output test
architecture neutrality notes
security notes
test strategy
```

Preset-generated architecture choices must be optional guidance or proposed ADRs. They must not
become accepted decisions without human action.

---

## 1.18 Context Pack / Token Reduction Support

Persist OS should eventually support:

```bash
persist context build
```

Output:

```txt
.persist/context/
  repo-summary.md
  architecture-summary.md
  module-map.md
  active-feature-context.md
  ai-handoff.md
```

Purpose:

- Help AI agents consume repo memory efficiently.
- Complement RTK-style token reduction tools.
- Provide concise context packs derived from source-of-truth docs.

Persist OS owns the durable memory.

Token tools can compress that memory.

---

## 1.19 Existing Repo Adoption

Persist OS must support existing repositories.

Default behavior:

- Detect existing files.
- Skip existing files.
- Create missing files.
- Report conflicts.
- Never overwrite by default.

Future command:

```bash
persist adopt
```

Adoption mode may suggest mapping existing docs, code structure, and technology signals into Persist
OS memory.

Adoption must produce reviewable memory, proposed decisions, or guidance. It must not silently
accept inferred architecture decisions.

Do not implement smart migration in MVP.

---

## 1.20 Monorepo Strategy

MVP:

- Allow init in current directory.
- Detect obvious monorepo indicators.
- Warn that workspace mode is not supported yet.

Future config:

```json
{
  "workspace": true,
  "projects": [
    {
      "name": "web",
      "path": "apps/web",
      "stack": "nextjs"
    },
    {
      "name": "mobile",
      "path": "apps/mobile",
      "stack": "flutter"
    }
  ]
}
```

Future commands:

```bash
persist init --scope apps/web
persist feature create billing --scope apps/web
```

---

## 1.21 Upgrade Strategy

Future command:

```bash
persist upgrade
```

Purpose:

- Detect old templates.
- Show changed templates.
- Suggest updates.
- Never overwrite local edits blindly.
- Show diff first.
- Skip modified files by default.

Generated files may include lightweight metadata:

```md
<!-- persist:template=feature-prd version=0.1.0 mode=standard -->
```

Metadata should be minimal and not ugly.

---

## 1.22 CLI UX Requirements

The CLI should feel calm and serious.

Required flags:

```txt
--help
--version
--dry-run
--force
--yes
--preset
--ai
--mode
```

Helpful output:

```txt
Created:
  .persist/config.json
  CLAUDE.md
  docs/10-architecture/ARCHITECTURE.md

Skipped:
  README.md already exists

Next:
  Run persist doctor
```

Errors should be clear.

Bad:

```txt
Error: EINVAL
```

Good:

```txt
Invalid feature name "../../evil".
Feature names cannot contain path traversal.
Try: persist feature create auth-provider
```

---

## 1.23 Recommended Tech Stack

Use:

```txt
Language: TypeScript
Runtime: Node.js LTS
Package manager: pnpm
CLI framework: Commander
Validation: Zod
Template engine: internal deterministic placeholder renderer
Testing: Vitest
Build: tsup
Linting: ESLint
Formatting: Prettier
CI: GitHub Actions
Distribution: npm
```

Why:

- Easy `npx` usage
- Strong TypeScript typing
- AI tools handle it well
- Good OSS contributor experience
- Deterministic builds
- Fast tests
- Minimal framework ceremony

Advanced template engines such as Eta are deferred until a future ADR shows they are needed.

---

## 1.24 MVP Acceptance Criteria

Persist OS v0.1 is acceptable when:

- `persist init` creates expected docs.
- `persist init` works in an empty folder.
- Existing files are skipped by default.
- `--dry-run` writes nothing and shows intended changes.
- `--force` overwrites only when explicit.
- `.persist/config.json` is created and validated.
- `feature create` creates feature docs.
- `adr create` creates correctly numbered ADRs.
- `module create` creates module memory docs.
- `preset list` shows presets.
- `doctor` reports repository memory health and standards evidence.
- Built-in presets validate.
- Default `persist init` generates neutral memory with no technology or architecture choices.
- Preset-generated choices are proposed, not silently accepted.
- Technology detection does not become accepted repository memory by itself.
- Golden tests exist for generated outputs.
- Security tests cover unsafe file paths.
- README explains philosophy and quickstart.
- Examples are committed.
- The project dogfoods its own docs.

---

## 1.25 Final PRD Recommendation

Build the MVP around the boring but powerful foundation:

```txt
architecture-neutral memory engine
safe filesystem
config manifest
template renderer
preset / opinion pack registry
init command
feature command
ADR command
module command
doctor command
tests
examples
README
```

Do not start with:

```txt
AI runtime generation
remote plugins
auto drift fixing
cloud features
all frameworks
complex monorepo support
```

The strongest first version is professional, local-first, safe, deterministic, and useful.

Persist OS should prove one idea extremely well:

> AI-built software needs durable engineering memory.
