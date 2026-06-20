# PRD: Engineering Standards Memory

## Summary

SpecForge should treat engineering standards as first-class repository memory.

Engineering Standards Memory captures how work must be done in a repository, including secrets handling, dependency review, documentation discipline, git hygiene, release evidence, migrations, operations, and AI agent behavior.

## Problem

Current memory docs capture product intent, architecture decisions, module ownership, testing, and security assumptions, but everyday engineering discipline is scattered across security, quality, dependency, and agent docs.

AI agents need one durable place to learn repository rules like:

- Never commit secrets.
- Do not hardcode API keys.
- Do not add dependencies without review.
- Do not bypass auth.
- Do not skip migrations.
- Do not claim completion without evidence.

## Goals

- Add Engineering Standards Memory as a first-class pillar.
- Add `docs/60-engineering/`.
- Create a small initial standards set.
- Define “Repository rules override model preferences.”
- Keep architecture higher than standards in source-of-truth order.
- Keep P1.6 docs-only.

## Non-Goals

- Runtime CLI changes.
- Config schema changes.
- Template generation changes.
- MCP runtime.
- New dependencies.
- Splitting every standard into separate files.

## Success Criteria

- Engineering standards are distinct from security and quality.
- Agent rules route to standards.
- Review and drift docs check standards.
- Existing tests and typecheck pass.
