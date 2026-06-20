# Project Structure

## Target Structure

SpecForge should dogfood the structure it generates.

```txt
specforge/
  CLAUDE.md
  AGENTS.md
  docs/
    00-product/
    10-architecture/
    20-security/
    30-modules/
    40-features/
    50-quality/
    60-engineering/
    ai/
    adrs/
    rfcs/
  .claude/
    skills/
  .agents/
    skills/
  src/
  tests/
  examples/
```

## P0 Scope

P0 creates docs and templates only:

- Product docs.
- Architecture docs.
- Security docs.
- Quality docs.
- AI agent docs.
- Root agent instruction files.
- Skill templates.
- MCP strategy doc.

P0 does not create CLI runtime code.

## Future Source Layout

Implementation should follow the module boundaries in `MODULE_BOUNDARIES.md`.

The expected future source layout is:

```txt
src/
  cli/
  commands/
  core/
    config/
    filesystem/
    generator/
    presets/
    doctor/
    naming/
    security/
```

Tests should mirror risk:

```txt
tests/
  unit/
  integration/
  security/
  golden/
  fixtures/
```
