# Persist OS Project Structure and Build Priority

## 1. Project Structure

Persist OS should dogfood the memory structure it generates.

Persist OS Core is architecture-neutral. It records, distributes, validates, and protects decisions;
it does not make architecture choices for users.

Recommended repository structure:

```txt
persist/
  README.md
  LICENSE
  package.json
  pnpm-lock.yaml
  tsconfig.json
  vitest.config.ts
  tsup.config.ts
  eslint.config.js
  prettier.config.js

  CLAUDE.md
  AGENTS.md

  .persist/
    config.json

  .cursor/
    rules/
      engineering-memory.mdc
      testing.mdc
      security.mdc

  .github/
    workflows/
      ci.yml
      release.yml
    PULL_REQUEST_TEMPLATE.md

  docs/
    00-product/
      BRD.md
      PRD.md
      PRODUCT_VISION.md
      ROADMAP.md
      POSITIONING.md

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
      EXTENSION_MODEL.md

    20-security/
      SECURITY_MODEL.md
      THREAT_MODEL.md
      SECURE_FILE_WRITES.md
      SUPPLY_CHAIN_SECURITY.md
      PRIVACY.md
      SECURITY_TEST_PLAN.md

    30-modules/
      cli/
        MODULE.md
        TASKS.md
        TEST_PLAN.md
        DECISIONS.md

      config/
        MODULE.md
        TASKS.md
        TEST_PLAN.md
        DECISIONS.md

      filesystem/
        MODULE.md
        TASKS.md
        TEST_PLAN.md
        DECISIONS.md

      generator/
        MODULE.md
        TASKS.md
        TEST_PLAN.md
        DECISIONS.md

      presets/
        MODULE.md
        TASKS.md
        TEST_PLAN.md
        DECISIONS.md

      templates/
        MODULE.md
        TASKS.md
        TEST_PLAN.md
        DECISIONS.md

      doctor/
        MODULE.md
        TASKS.md
        TEST_PLAN.md
        DECISIONS.md

    40-features/
      F-001-core-filesystem-safety/
        PRD.md
        ACCEPTANCE.md
        ARCHITECTURE_IMPACT.md
        CHANGE_REQUESTS.md
        PLAN.md
        TASKS.md
        TEST_PLAN.md
        REVIEW.md
        COMPLETION_REPORT.md

      F-002-init-command/
        PRD.md
        ACCEPTANCE.md
        ARCHITECTURE_IMPACT.md
        CHANGE_REQUESTS.md
        PLAN.md
        TASKS.md
        TEST_PLAN.md
        REVIEW.md
        COMPLETION_REPORT.md

    50-quality/
      TESTING_STRATEGY.md
      DEFINITION_OF_DONE.md
      CODE_REVIEW_CHECKLIST.md
      AI_REVIEW_CHECKLIST.md
      ARCHITECTURE_DRIFT_CHECKLIST.md
      RELEASE_CHECKLIST.md
      DOCUMENT_QUALITY_RUBRIC.md

    60-engineering/
      ENGINEERING_STANDARDS.md
      AI_AGENT_RULES.md
      CODE_REVIEW_RULES.md

    adrs/
      ADR-0001-deterministic-placeholder-renderer.md
      ADR-0002-typescript-node-cli.md
      ADR-0003-local-first-no-telemetry.md
      ADR-0004-non-destructive-file-write-policy.md

    rfcs/
      RFC_TEMPLATE.md

  src/
    index.ts

    cli/
      main.ts
      command-registry.ts
      output.ts
      errors.ts
      exit-codes.ts

    commands/
      init.ts
      doctor.ts
      preset-list.ts

      feature/
        create.ts

      adr/
        create.ts

      module/
        create.ts

    core/
      config/
        config-schema.ts
        load-config.ts
        write-config.ts
        default-config.ts

      filesystem/
        safe-path.ts
        write-plan.ts
        write-file-safe.ts
        read-existing-tree.ts
        conflict-policy.ts

      generator/
        generate-project.ts
        generate-feature.ts
        generate-module.ts
        generate-adr.ts
        render-template.ts
        template-context.ts

      presets/
        preset-schema.ts
        preset-registry.ts
        validate-preset.ts

      doctor/
        doctor-check.ts
        doctor-report.ts
        checks/
          config-check.ts
          required-files-check.ts
          docs-check.ts
          ai-tools-check.ts
          security-docs-check.ts

      naming/
        slugify.ts
        titleize.ts
        adr-number.ts
        feature-number.ts

      security/
        validate-user-path.ts
        prevent-path-traversal.ts
        symlink-policy.ts

      result/
        result.ts
        errors.ts

    presets/
      generic/
        preset.ts
        templates/

      nextjs/
        preset.ts
        templates/

      ios-swift/
        preset.ts
        templates/

      flutter/
        preset.ts
        templates/

    templates/
      common/
        CLAUDE.md.template
        AGENTS.md.template
        ARCHITECTURE.md.template
        MODULE_BOUNDARIES.md.template
        FEATURE_PRD.md.template
        ACCEPTANCE.md.template
        ARCHITECTURE_IMPACT.md.template
        CHANGE_REQUESTS.md.template
        TEST_PLAN.md.template
        MODULE.md.template
        ADR.md.template
        SECURITY_MODEL.md.template
        THREAT_MODEL.md.template
        DEFINITION_OF_DONE.md.template
        AI_REVIEW_CHECKLIST.md.template
        ARCHITECTURE_DRIFT_CHECKLIST.md.template
        COMPLETION_REPORT.md.template

  tests/
    unit/
      naming/
        slugify.test.ts
        adr-number.test.ts
        feature-number.test.ts

      filesystem/
        safe-path.test.ts
        write-plan.test.ts
        write-file-safe.test.ts
        conflict-policy.test.ts

      config/
        config-schema.test.ts
        load-config.test.ts

      presets/
        preset-schema.test.ts
        validate-preset.test.ts

      generator/
        render-template.test.ts
        generate-feature.test.ts
        generate-adr.test.ts

    integration/
      init-command.test.ts
      feature-create-command.test.ts
      module-create-command.test.ts
      adr-create-command.test.ts
      doctor-command.test.ts
      preset-list-command.test.ts

    security/
      path-traversal.test.ts
      symlink-policy.test.ts
      malicious-input.test.ts
      overwrite-policy.test.ts
      dry-run-safety.test.ts

    golden/
      generated-generic.test.ts
      generated-nextjs.test.ts
      generated-ios-swift.test.ts
      generated-flutter.test.ts

    fixtures/
      empty-repo/
      existing-docs-repo/
      existing-claude-md-repo/
      monorepo/
      malicious-paths/

  examples/
    generated-generic/
    generated-nextjs/
    generated-ios-swift/
    generated-flutter/
```

---

# 2. Final Build Priority

## P0: Repository Constitution

Create the project’s own memory first.

Files:

```txt
docs/00-product/BRD.md
docs/00-product/PRD.md
docs/10-architecture/ARCHITECTURE.md
docs/10-architecture/TECH_STACK.md
docs/10-architecture/FILE_WRITE_POLICY.md
docs/20-security/SECURITY_MODEL.md
docs/20-security/THREAT_MODEL.md
docs/50-quality/TESTING_STRATEGY.md
docs/50-quality/DEFINITION_OF_DONE.md
docs/60-engineering/ENGINEERING_STANDARDS.md
docs/60-engineering/AI_AGENT_RULES.md
CLAUDE.md
AGENTS.md
```

Why first:

Persist OS must prove its own idea by using the same system to build itself.

No implementation before repo constitution.

---

## P1: Core Filesystem Safety

Build this before any command.

Files:

```txt
src/core/filesystem/safe-path.ts
src/core/filesystem/write-plan.ts
src/core/filesystem/write-file-safe.ts
src/core/filesystem/conflict-policy.ts
src/core/naming/slugify.ts
```

Tests:

```txt
tests/unit/filesystem/safe-path.test.ts
tests/unit/filesystem/write-file-safe.test.ts
tests/security/path-traversal.test.ts
tests/security/overwrite-policy.test.ts
tests/security/symlink-policy.test.ts
```

Acceptance criteria:

- Reject path traversal.
- Reject unsafe names.
- Skip existing files by default.
- Dry run writes nothing.
- Force overwrite only when explicit.
- Never write outside project root.

Reason:

Every other feature depends on safe writing.

This is the foundation.

---

## P2: Config Manifest

Build:

```txt
src/core/config/config-schema.ts
src/core/config/load-config.ts
src/core/config/write-config.ts
src/core/config/default-config.ts
```

Tests:

```txt
tests/unit/config/config-schema.test.ts
tests/unit/config/load-config.test.ts
```

Acceptance criteria:

- Creates `.persist/config.json`.
- Validates config.
- Rejects invalid config.
- Does not store secrets.
- Commands can read paths from config.
- P2 config does not include decision indexes or organization standards.

Reason:

Commands should not guess directory paths.

---

## P3: Template Renderer

Build:

```txt
src/core/generator/render-template.ts
src/core/generator/template-context.ts
```

Tests:

```txt
tests/unit/generator/render-template.test.ts
```

Acceptance criteria:

- Renders deterministic templates.
- Fails clearly on missing required values.
- Validates context keys before rendering.
- Does not execute user-provided code.
- Supports common markdown templates.

Reason:

The product is mostly generated artifacts. Template quality matters.

---

## P4: Preset System

In architecture terms, presets are opinion packs.

The CLI term remains `preset`.

Presets may provide optional starter guidance and proposed ADRs. They must not silently create
accepted architecture decisions.

P4 should prove the preset contract with minimal built-in content. Rich framework guidance is
deferred until real usage proves the model works.

Build:

```txt
src/core/presets/preset-schema.ts
src/core/presets/preset-registry.ts
src/core/presets/validate-preset.ts

src/presets/generic/preset.ts
src/presets/nextjs/preset.ts
src/presets/ios-swift/preset.ts
src/presets/flutter/preset.ts
```

Tests:

```txt
tests/unit/presets/preset-schema.test.ts
tests/unit/presets/validate-preset.test.ts
```

Acceptance criteria:

- All built-in presets validate.
- Preset template destinations are safe.
- Duplicate output paths are rejected.
- Preset-generated decisions are marked as proposed or optional guidance.
- Preset list can read registry.

Reason:

This makes the project extensible.

---

## P5: Init Command

Build:

```txt
src/commands/init.ts
```

Tests:

```txt
tests/integration/init-command.test.ts
tests/golden/generated-generic.test.ts
tests/golden/generated-nextjs.test.ts
tests/golden/generated-ios-swift.test.ts
tests/golden/generated-flutter.test.ts
```

Acceptance criteria:

- `persist init` creates config and docs.
- Neutral `persist init` creates memory docs without architecture or technology choices.
- `persist init` works in an empty folder.
- `persist init` does not require existing app code, framework files, or Git.
- `--preset nextjs` uses the Next.js preset as optional opinion-pack guidance.
- Preset guidance and detected technologies do not become accepted repository memory by themselves.
- Existing files are skipped.
- `--dry-run` shows planned writes.
- `--force` overwrites explicitly.
- Generated output matches golden snapshots.

Reason:

This is the primary product experience.

---

## P6: Feature Create Command

Build:

```txt
src/commands/feature/create.ts
src/core/generator/generate-feature.ts
src/core/naming/feature-number.ts
```

Tests:

```txt
tests/integration/feature-create-command.test.ts
tests/unit/generator/generate-feature.test.ts
tests/unit/naming/feature-number.test.ts
```

Acceptance criteria:

- Creates feature folder with required docs.
- Feature number increments.
- Unsafe names are rejected.
- Existing same-slug feature memory is reused and skipped by default.
- Generated feature docs include PRD, acceptance, architecture impact, change requests, task plan,
  test plan, review, and completion report.

Reason:

Feature workflow is the heart of AI-safe delivery.

---

## P7: ADR Create Command

Build:

```txt
src/commands/adr/create.ts
src/core/generator/generate-adr.ts
src/core/naming/adr-number.ts
```

Tests:

```txt
tests/integration/adr-create-command.test.ts
tests/unit/naming/adr-number.test.ts
tests/unit/generator/generate-adr.test.ts
```

Acceptance criteria:

- Creates next ADR number.
- Ignores malformed ADR files.
- Rejects unsafe names.
- Existing same-slug ADR memory is reused and skipped by default.
- Generated ADRs are proposed by default.
- Includes status, context, decision, alternatives, consequences, related docs.

Reason:

Architecture decisions need durable memory.

---

## P8: Module Create Command

Build:

```txt
src/commands/module/create.ts
src/core/generator/generate-module.ts
```

Tests:

```txt
tests/integration/module-create-command.test.ts
tests/unit/generator/generate-module.test.ts
```

Acceptance criteria:

- Creates module docs.
- Rejects unsafe names.
- Skips existing module docs by default.
- Respects configured `modulesDir`.
- Includes MODULE.md, TASKS.md, TEST_PLAN.md, DECISIONS.md.

Reason:

Module memory helps AI agents preserve boundaries.

---

## P9: Doctor Command

Build:

```txt
src/commands/doctor.ts
src/core/doctor/doctor-check.ts
src/core/doctor/doctor-report.ts
src/core/doctor/checks/
```

Tests:

```txt
tests/integration/doctor-command.test.ts
```

Acceptance criteria:

- Detects missing config.
- Detects missing required docs.
- Detects missing AI files.
- Detects invalid config.
- Gives clear actionable output.
- Exits with appropriate status code.

Reason:

Doctor turns Persist OS from generator into maintainable system.

---

## P10: Documentation, Examples, Release

Build:

```txt
README.md
examples/generated-generic/
examples/generated-nextjs/
examples/generated-ios-swift/
examples/generated-flutter/
.github/workflows/ci.yml
.github/workflows/release.yml
```

Acceptance criteria:

- README explains philosophy clearly.
- Quickstart works.
- Examples show generated output.
- CI runs lint, typecheck, tests.
- Package can be published to npm.
- Release process is documented.

Reason:

For OSS reputation, README and examples are part of the product.

---

# 3. Dogfooding Evaluation Plan

Persist OS should evaluate itself by using its own workflow.

## 3.1 Evaluation Question

Can Persist OS help build Persist OS better?

## 3.2 Evaluation Method

For every feature built in Persist OS:

1. Create feature folder.
2. Write PRD.
3. Write acceptance criteria.
4. Write architecture impact.
5. Write test plan.
6. Break into tasks.
7. Implement one task at a time.
8. Update module docs.
9. Run tests.
10. Write completion report.
11. Run drift review.
12. Review whether Persist OS’s generated structure helped.

## 3.3 Evaluation Template

Add this to each feature review:

```md
# Dogfooding Review

## Did Persist OS-generated docs help implementation?

## Which docs were useful?

## Which docs were ignored?

## Which docs were too vague?

## Which docs were missing?

## Did the workflow catch any issue?

## Did the workflow slow us down unnecessarily?

## What should Persist OS improve before public release?
```

## 3.4 Success Signal

Persist OS is useful if its own generated system catches:

- Missing tests
- Unsafe file writes
- Unclear requirements
- Architecture drift
- Missing ADRs
- Stale module docs
- Weak completion reports

If it cannot help build itself, it is not ready to help other projects.

---

# 4. First Prompt for Codex or Claude Code

Use this as the first implementation prompt:

```md
You are building Persist OS, an open-source TypeScript CLI.

Persist OS creates and maintains an AI-ready engineering memory layer inside software repositories.

Read these documents first:

- docs/00-product/BRD.md
- docs/00-product/PRD.md
- docs/10-architecture/ARCHITECTURE.md
- docs/10-architecture/FILE_WRITE_POLICY.md
- docs/20-security/SECURITY_MODEL.md
- docs/20-security/THREAT_MODEL.md
- docs/50-quality/TESTING_STRATEGY.md
- docs/50-quality/DEFINITION_OF_DONE.md
- docs/50-quality/ARCHITECTURE_DRIFT_CHECKLIST.md

Mandatory rules:

1. Do not implement all commands at once.
2. Start with core filesystem safety.
3. Add tests before command implementation.
4. Use deterministic templates only.
5. Do not add network calls.
6. Do not overwrite existing files by default.
7. Reject unsafe paths and path traversal.
8. Update module docs after implementation.
9. Write a completion report after each task.
10. Do not claim completion without commands run and test results.

Current task:

Implement P1 only:

- src/core/filesystem/safe-path.ts
- src/core/filesystem/write-plan.ts
- src/core/filesystem/write-file-safe.ts
- src/core/filesystem/conflict-policy.ts
- src/core/naming/slugify.ts

Add unit and security tests.

Do not implement CLI commands yet.

Report:

- files changed
- tests added
- commands run
- results
- remaining risks
```

---

# 5. Final Priority Summary

Build in this order:

```txt
P0  Repo constitution
P1  Filesystem safety
P2  Config manifest
P3  Template renderer
P4  Preset system
P5  Init command
P6  Feature create
P7  ADR create
P8  Module create
P9  Doctor command
P10 Docs, examples, release
P11 Product vision and roadmap alignment
P12 Doctor standards checks
P13 Drift detection MVP
P14 Legacy adoption planning
P15 Organization memory planning
```

Do not skip P1.

Do not start with UI.

Do not start with every framework.

Do not start with plugins.

Do not start with AI generation.

Start with safe, deterministic, boring engineering.

That is what will make Persist OS respected.

After P10, the product should stay focused on the core thesis:

```txt
Git tracks what changed.
Persist OS tracks why it changed.
```

The next milestones should deepen memory, discipline, governance, and drift detection. They should
not turn Persist OS into an AI coding agent, IDE competitor, app generator, architecture generator,
agent runtime, model host, or cloud execution platform.
