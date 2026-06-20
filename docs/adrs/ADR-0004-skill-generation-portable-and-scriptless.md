# ADR-0004: Skill Generation Is Portable And Scriptless

## Status

Accepted

## Context

Recall OS should generate AI agent skills so a repository gets reusable, durable workflows (write
tests, create a PRD, review security, and so on). Skills follow the open Agent Skills standard, which
allows many optional fields, supporting scripts, and Claude Code-specific extensions. Recall OS emits
to two targets: `.claude/skills/` for Claude Code and `.agents/skills/` as the portable target for
other Agent Skills-compatible tools.

## Decision

Generated skills use only the standard, portable Agent Skills fields and contain no scripts.

- Frontmatter includes only `name` and `description`. `name` is validated against
  `^[a-z0-9](-?[a-z0-9])*$`, is at most 64 characters, and matches the skill directory. `description`
  is at most 1024 characters and includes "Use when" trigger language so agents invoke the skill at
  the right moment.
- The body routes to source-of-truth docs instead of duplicating them and stays well under the
  recommended size.
- No scripts, no Claude Code-only fields, and no dynamic shell injection are generated, so the same
  SKILL.md is valid and portable across tools and respects the MVP "no scripts in generated skills"
  rule.
- The identical file is written to both `.claude/skills/<name>/SKILL.md` and
  `.agents/skills/<name>/SKILL.md`.
- A built-in catalog provides the documented MVP skill set; unknown names produce a valid skeleton.

## Alternatives Considered

- Generate Claude Code-specific skills with dynamic context injection and scripts. Rejected: it
  breaks portability to the `.agents/skills` target and conflicts with the no-scripts rule.
- Emit only to `.claude/skills/`. Rejected: the portable target is part of Recall OS's context
  distribution strategy.
- Free-form skill bodies. Rejected: a consistent section structure keeps generated skills reviewable
  and useful.

## Consequences

- Generated skills are valid Agent Skills and work across compatible tools unchanged.
- Skills stay safe: no executable code is generated into a repository.
- Richer Claude Code-specific features are intentionally out of scope for generation.
- Recall OS can dogfood its own skill set by generating it from the catalog.

## Related Documents

- `docs/40-features/F-023-skill-generation/`
- `docs/ai/AI_AGENTS_SKILLS_MCP_STRATEGY.md`
- `docs/60-engineering/AI_AGENT_RULES.md`
