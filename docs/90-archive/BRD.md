# BRD: Persist OS

## 1. Business Requirements Document

## 1.1 Product Name

Working name: **Persist OS**

Alternative names under consideration:

- RepoMemory
- DriftKit
- ArchKit
- SpecRail
- ContextForge

The final name should be short, memorable, OSS-friendly, easy to search, and not already occupied by
an existing AI infrastructure product.

---

## 1.2 Executive Summary

Persist OS is an open-source CLI that creates and maintains an AI-ready engineering memory layer
inside software repositories.

It helps developers, founders, and AI-assisted builders create better software by giving AI coding
agents durable project context, architectural boundaries, test expectations, security expectations,
review workflows, and documentation discipline.

Persist OS is an Engineering Memory Operating System.

It preserves product intent, architecture decisions, module ownership, testing requirements,
security assumptions, engineering standards, and operational discipline, and makes them durable,
reviewable, and AI-readable.

Persist OS is intentionally architecture-neutral. Its role is not to determine what architecture a
team should adopt. Its role is to ensure that architecture decisions, regardless of their content,
become durable, reviewable, AI-readable repository memory.

Persist OS is not a boilerplate generator. It is not an AI coding agent. It is not a SaaS product.

It is a local-first repository operating system for AI-assisted software delivery.

Git initializes source control.

Persist OS initializes repository memory.

Code may come before or after Persist OS.

The central belief:

> AI can produce code quickly, but without durable engineering memory, architecture decisions,
> module boundaries, testing discipline, and review gates, AI-assisted projects drift into messy,
> fragile software.

Persist OS exists to prevent that.

---

## 1.3 Vision

Persist OS should become the default open-source foundation layer for AI-assisted software
development.

The long-term vision is that a developer can run:

```bash
npx persist init
```

and the repository becomes ready for serious AI-assisted development.

It should create the structure that helps Claude Code, Codex, Cursor, GitHub Copilot, and future AI
coding agents work inside a repo safely.

The default `persist init` experience should be neutral: memory engine first, no technology
opinions, no architecture opinions.

`persist init` should work in an empty folder. It should not require an existing application,
framework, or Git repository, though Git is recommended for normal development.

The desired category:

> Engineering Memory Operating System

Not:

> Markdown generator

Not:

> Boilerplate generator

Not:

> Prompt pack

The public reputation goal is for developers to remember:

> “Use Persist OS first before letting AI build your repo.”

---

## 1.4 Problem Statement

AI coding tools are improving fast, but many repositories are not prepared for AI-driven work.

Common problems:

- Architecture decisions live only in chat history.
- AI agents forget context after compaction or session changes.
- Requirements change without PRDs being updated.
- AI introduces inconsistent patterns across features.
- Modules do not have clear ownership.
- Tests are created randomly instead of being derived from requirements and risks.
- Security docs are generic and useless.
- Review focuses only on whether code works, not whether architecture is preserved.
- Different AI tools need different instruction files.
- AI agents create “done” messages without evidence.
- Teams lack a repeatable process for handling architecture drift.
- Existing tools focus on code generation, task generation, or token reduction, but not durable
  engineering memory.

This causes fast technical debt.

AI increases code volume faster than it increases architectural judgment.

Persist OS solves this by creating a structured, version-controlled engineering memory system.

---

## 1.5 Target Users

### Primary Users

- Solo founders using AI coding tools
- Indie hackers
- Open-source maintainers
- Startup engineers
- AI-heavy product teams
- Smart non-coders using AI to build products
- Developers returning to building after time away from hands-on coding

### Secondary Users

- Engineering managers
- Tech leads
- Developer productivity teams
- Consultants helping teams adopt AI coding workflows
- Bootcamp students and self-taught builders
- Agencies building AI-assisted apps for clients

---

## 1.6 User Personas

### Persona 1: Solo Founder

Wants to build fast with Claude Code, Codex, or Cursor.

Pain:

- Does not want the codebase to become messy.
- Needs structure without hiring a senior engineering team.
- Wants AI to follow architecture and update docs.

Needs:

- Simple setup
- Strong defaults
- Feature templates
- ADRs
- Testing guidance
- AI review checklist

---

### Persona 2: Smart Non-Coder Builder

Has product sense but limited coding experience.

Pain:

- Can prompt AI to build features but cannot judge architecture quality.
- Does not know what professional tests should look like.
- Does not know what security docs should contain.
- Gets working demos but fragile products.

Needs:

- Guided mode
- Plain-language explanations
- Professional templates
- Guardrails
- Definition of done
- AI task workflows

---

### Persona 3: Startup Engineer

Works in a fast-moving codebase with AI tools.

Pain:

- AI creates duplicate utilities, services, and patterns.
- Requirements change frequently.
- Review burden increases.
- Architecture docs are stale.

Needs:

- Architecture drift checks
- Module docs
- Change request flow
- ADR workflow
- Review reports
- CI-friendly doctor command

---

### Persona 4: OSS Maintainer

Wants contributors using AI to submit better PRs.

Pain:

- AI-generated PRs are broad, messy, and poorly tested.
- Contributors ignore architecture.
- Maintainer review becomes exhausting.

Needs:

- Contributor-facing AI rules
- PR checklist
- Testing strategy
- Module ownership docs
- Security contribution rules
- Generated examples

---

## 1.7 Core Value Proposition

Persist OS gives AI agents durable rails.

It creates a version-controlled repository memory system with five layers:

```txt
1. Product memory
   PRDs, roadmap, user stories, acceptance criteria

2. Architecture memory
   architecture docs, ADRs, module boundaries, dependency policy

3. Module memory
   MODULE.md per module, module test plans, module decisions

4. Execution memory
   feature plans, tasks, change requests, review reports

5. Verification memory
   tests, checklists, security reviews, completion reports, CI evidence
```

The main promise:

> Stop relying on perfect prompts. Give the repo durable memory.

Persist OS does not make architecture decisions.

Persist OS records, distributes, validates, and protects architecture decisions.

Those decisions can come from repository owners, accepted ADRs, organization standards, or optional
presets.

---

## 1.8 Strategic Differentiation

Persist OS is different from adjacent tools.

### Not a boilerplate generator

Boilerplate generators create source code structure.

Persist OS creates engineering memory and AI workflow structure.

### Not a repo summarizer

Repo summarizers compress existing context.

Persist OS creates and maintains the source-of-truth context.

### Not a task manager

Task tools create task lists.

Persist OS links tasks back to PRDs, ADRs, module docs, test plans, and change requests.

### Not an AI coding agent

Persist OS does not write production app code.

It prepares the repository so AI coding agents can work better.

### Not a prompt pack

Prompt packs are temporary.

Persist OS writes durable, version-controlled artifacts.

---

## 1.9 Business Goals

Since the primary motive is public profile, not direct revenue, success should be measured by
ecosystem impact.

### Reputation Goals

- Become known for AI-ready engineering memory.
- Create a respected OSS project.
- Help AI builders produce better software.
- Become cited in AI coding workflows, blog posts, and videos.
- Attract contributors who add presets, templates, and workflow packs.
- Build public credibility as someone thinking deeply about AI-assisted software engineering.

### Community Goals

- Developers use Persist OS in real projects.
- Contributors add high-quality presets.
- Other AI tooling projects integrate with Persist OS concepts.
- Builders discuss “repo memory” and “architecture drift” using Persist OS language.
- Smart non-coders become better AI builders by using generated workflows.

---

## 1.10 Success Metrics

### MVP Success Metrics

- A developer can run `persist init` in under two minutes.
- Default `persist init` creates neutral memory with no architecture or technology choices.
- Empty-folder `persist init` is a first-class workflow.
- Existing files are never overwritten by default.
- Generated docs are useful without long explanation.
- Optional presets exist as opinion packs, not architecture mandates.
- Claude/Codex/Cursor instruction files are generated.
- `doctor` command detects missing or broken structure.
- Security tests cover path traversal and overwrite safety.
- README clearly explains the philosophy.

### Public Profile Metrics

- 10 real developers initialize real repos and keep generated files.
- 3 external contributors submit useful issues or PRs.
- 1 external contributor adds or improves a preset.
- 1 blog/newsletter/video mentions the project.
- 1 real open-source repo adopts it.
- GitHub stars are useful but not the only success metric.

### Long-Term Ecosystem Metrics

- Community presets exist.
- Other AI tools integrate with Persist OS output.
- Persist OS becomes a recommended first step for AI-assisted repos.
- “Architecture drift review” becomes part of AI coding workflows.

---

## 1.11 Scope

### MVP Scope

Persist OS v0.1 should include:

- Local-first CLI
- Deterministic template generation
- Config manifest
- Non-destructive file writing
- Optional built-in presets as opinion packs
- AI tool targets
- Feature creation
- ADR creation
- Module creation
- Doctor command
- Professional docs and examples
- Unit, integration, golden, and security tests

### Post-MVP Scope

- Upgrade command
- Plugin system
- Community presets
- Context pack generation
- Drift check command
- GitHub Action
- Monorepo workspace mode
- RFC workflow
- Preset registry
- Advanced adoption mode

### Explicit Non-Goals

Persist OS v0.1 will not:

- Generate production app code
- Call AI APIs
- Require API keys
- Send repository contents to remote services
- Auto-fix architecture drift
- Execute remote templates
- Install project dependencies
- Replace human review
- Replace Claude Code, Codex, Cursor, or Copilot

---

## 1.12 Business Risks

### Risk 1: Perceived as “just markdown generation”

Mitigation:

- Strong README positioning
- Demo real workflow
- Include `doctor`
- Include feature, ADR, module, and review workflows
- Show before/after AI workflow

### Risk 2: Too much process for solo builders

Mitigation:

- Add modes: lite, standard, strict
- Keep MVP default practical
- Use guided mode later
- Generated docs should be short and useful

### Risk 3: Too many stacks too early

Mitigation:

- Make neutral init the primary path
- Treat presets as optional opinion packs
- Design preset system for community extension
- Do not personally maintain every framework
- Treat technology detection as guidance, not accepted repository memory

### Risk 4: Generated docs become fluff

Mitigation:

- Add document quality rubric
- Keep templates specific
- Require source-of-truth links
- Include professional testing/security standards

### Risk 5: Unsafe file writes damage user repos

Mitigation:

- Safe path validation
- Skip existing files by default
- `--dry-run`
- `--force` only explicit
- Security tests
- Symlink protection

### Risk 6: OSS community quality drops

Mitigation:

- CONTRIBUTING.md
- GOVERNANCE.md
- PRESET_CONTRIBUTION_GUIDE.md
- RFC process
- Preset schema
- Golden tests for presets

---

## 1.13 Governance Requirements

Persist OS should include:

```txt
GOVERNANCE.md
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
PRESET_CONTRIBUTION_GUIDE.md
RFC_TEMPLATE.md
```

Major changes should require RFCs:

- Plugin system
- Remote preset registry
- Telemetry
- AI-powered generation
- Cloud features
- Security-sensitive behavior
- Remote templates

ADR vs RFC distinction:

```txt
RFC = proposed change before decision
ADR = accepted architecture decision after decision
```

---

## 1.14 Open Source License

Recommended:

```txt
Code: MIT
Generated output/templates: MIT / no attribution required
```

Reason:

- Developers should be able to use generated files in commercial and open-source projects.
- No attribution burden.
- Maximum adoption.
- OSS-friendly.

---

## 1.15 Trust and Privacy Requirements

Persist OS must be local-first.

Security promises:

- No telemetry in MVP
- No network calls in MVP
- No API keys
- No repo upload
- No source-code analysis beyond basic project detection
- No reading `.env` files
- No secret collection
- No hidden background process
- No dependency installation inside user projects

This should be clearly stated in README.

---

## 1.16 Product Positioning

One-liner:

> Persist OS creates AI-ready engineering memory for your repository.

Short pitch:

> AI coding agents move fast. Persist OS gives them specs, ADRs, module memory, security
> expectations, test strategy, review gates, and architecture drift checks so they can build without
> wrecking your codebase.

Category:

> AI-ready engineering memory

Taglines:

- “Prompting is temporary. Repo memory is durable.”
- “Give AI agents decisions, not vibes.”
- “Specs, ADRs, tests, and drift checks for AI-built software.”
- “The missing memory layer for AI coding agents.”

---

## 1.17 Launch Strategy

### Launch Assets

- Strong README
- Demo GIF or terminal recording
- Generated examples
- Blog post: “Why AI-built repos need engineering memory”
- Sample generated Next.js repo
- Sample generated iOS Swift repo
- Sample generated Flutter repo
- Comparison with raw prompting
- Public roadmap

### Initial Launch Channels

- GitHub
- LinkedIn
- X
- Hacker News
- Reddit developer communities
- AI coding communities
- Indie hacker communities

### Launch Message

Focus less on “CLI that creates files.”

Focus more on:

> AI can write code. Persist OS helps it build software.

---

## 1.18 Final BRD Recommendation

Build Persist OS as an OSS foundation layer for AI-assisted software delivery.

The project should be useful to:

- Experienced engineers who want discipline
- Solo founders who want structure
- Non-coders who want better AI-built products
- OSS maintainers who want cleaner AI-generated contributions

The strongest reputation angle is not the CLI itself.

The strongest reputation angle is the philosophy:

> AI builders need repo memory, not just prompts.
