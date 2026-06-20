# Skill Authoring Guide

## Purpose

SpecForge skills are focused reusable workflows for AI coding agents.

They should help agents perform specific engineering jobs without loading the entire project handbook into context.

## Required Structure

Each skill lives in a directory:

```txt
<skill-name>/
  SKILL.md
```

MVP skills must not include scripts.

`SKILL.md` must start with YAML frontmatter:

```md
---
name: skill-name
description: Clear description of what this skill does and when to use it.
---
```

## Required Sections

Each skill body should include:

- Purpose
- Inputs
- Required Reading
- Output Files
- Process
- Stop Conditions
- Quality Bar

## Naming Rules

Skill names should:

- Use lowercase letters, numbers, and hyphens.
- Be short and specific.
- Match the skill directory name.
- Avoid generic names like `helper` or `workflow`.

## Description Rules

Descriptions should explain:

- What the skill does.
- When the agent should use it.
- Important boundaries.

Good:

```txt
Review a change for undocumented architecture, dependency, module, security, testing, or documentation drift.
```

Bad:

```txt
Helps with quality.
```

## Quality Rules

A good skill must:

- Tell the agent what job it performs.
- Tell the agent what files to read first.
- Tell the agent what files it may create or update.
- Define stop conditions.
- Define output quality expectations.
- Avoid vague instructions.
- Avoid duplicating architecture docs.
- Route to source-of-truth docs.

## MVP Constraints

MVP skill templates must not:

- Include scripts.
- Require network access.
- Execute tools automatically.
- Connect to MCP servers.
- Call AI APIs.
- Override source-of-truth docs.
