# Engineering Standards

## Purpose

Engineering Standards Memory answers:

```txt
How must work be done in this repo?
```

These standards are repository memory. They apply to humans and AI agents.

Repository rules override model preferences.

If an AI model suggests an action that conflicts with these standards, the repository wins.

## Relationship To Other Memory

- Product Memory = why.
- Architecture Memory = what.
- Engineering Standards Memory = how.
- Module Memory = where.
- Testing Memory = how we verify.
- Security Memory = what must be protected.

Architecture docs remain higher than engineering standards. Architecture defines what the system is. Standards define how work is performed.

## Source-Of-Truth Order

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

If sources conflict, stop and report the conflict.

## Secrets

- Never commit secrets.
- Never commit `.env` contents.
- Never hardcode API keys, tokens, passwords, or credentials.
- Use environment variables, local ignored files, or secret managers.
- Do not print secrets in logs, completion reports, tests, docs, or examples.
- If a secret may have been exposed, stop and request human security review.

## Dependencies

- Do not add production dependencies without review.
- Consider ADR impact before dependencies that affect security, networking, telemetry, file writes, auth, secrets, storage, or template execution.
- Prefer Node built-ins when they are sufficient.
- Do not add dependencies that introduce hidden network calls, postinstall behavior, or background processes without explicit review.
- Do not install dependencies into user projects during MVP.

## Documentation

- Update docs when behavior, architecture, security posture, module ownership, or testing expectations change.
- Do not let generated docs drift from accepted repository memory.
- Keep root agent files concise and route to durable source-of-truth docs.
- Do not duplicate large architecture content inside skills or prompts.

## Git And Change Hygiene

- Keep changes scoped to the task.
- Do not revert user changes unless explicitly requested.
- Do not use destructive git commands without explicit human approval.
- Do not claim completion without listing files changed, commands run, results, skipped checks, and remaining risks.

## Releases

- Do not release without evidence.
- Release evidence must include tests, typecheck, build or package verification when available, docs review, and known risks.
- Do not release if existing files can be overwritten by default, writes can escape the project root, runtime network calls exist in MVP, telemetry exists in MVP, or generated docs are stale.

## Migrations

- Do not skip required migrations or migration docs.
- Any migration that changes data, persistence, config, generated output, or compatibility needs a documented plan, rollback or recovery note, and tests where practical.
- If migration impact is unclear, stop and request human review.

## Operations

- Do not add network, telemetry, cloud, runtime MCP, background process, or remote template behavior in MVP.
- Do not change operational assumptions without architecture and security review.
- Document observability, logging, deployment, and runtime assumptions when they become accepted repository decisions.

## AI Agent Behavior

- Follow repository memory over model preference.
- Stop when user instructions conflict with accepted repository memory.
- Stop when asked to commit secrets, bypass auth, skip tests without reason, add dependencies without review, or claim completion without evidence.
- Use feature docs and module memory for module work before implementation.
