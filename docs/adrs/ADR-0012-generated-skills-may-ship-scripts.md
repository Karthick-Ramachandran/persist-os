# ADR-0012: Generated Skills May Ship Scripts

## Status

Accepted

## Context

`CLAUDE.md` and `AGENTS.md` carry an explicit MVP constraint: _"Do not add scripts inside generated
skills for MVP."_ [ADR-0004](ADR-0004-skill-generation-portable-and-scriptless.md) records the same
decision — generated skills are portable, inert markdown and nothing else.

That constraint was correct for the MVP. Every generated artifact being inert markdown is a strong
security property: `persist init` writes nothing executable into a user's repository, so there is no
code path from installing Persist OS to running Persist OS's code.

It now conflicts with [ADR-0008](ADR-0008-skill-architecture-progressive-disclosure.md). The
scriptless rule forces every deterministic operation to be described in prose, which costs context
on every activation and produces worse results than running the operation. A validation described in
forty lines of markdown is re-derived by the model every time; the same validation as a script runs
without its source entering context at all, and only its output comes back.

Repository rules override model preferences, so this reversal is recorded rather than assumed.

## Decision

Generated skills may ship a `scripts/` directory. ADR-0004 is superseded.

Four constraints keep the original security property mostly intact:

1. **Scripts are opt-in per skill, never per repository.** No script is written unless the skill
   that needs it is generated, and `persist init` says in its output which executable files it
   wrote.
2. **Scripts are read-only and local.** No network calls, no telemetry, no AI API calls, no writes
   outside the repository root. This is the same constraint the CLI itself operates under and is
   verified by test, not by convention.
3. **A skill must work without its scripts.** The `SKILL.md` workflow states what the script does,
   so a user who deletes `scripts/`, or an agent in an environment that cannot execute, degrades to
   the prose path rather than failing.
4. **Scripts count against the write policy.** They go through the same safe, root-confined,
   never-overwrite-by-default pipeline as every other generated file.

The security model gains a section covering executable generated output, and the threat model gains
the corresponding entry.

## Alternatives Considered

- **Keep the rule; put deterministic work in `persist` subcommands instead.** Seriously considered,
  and partly adopted — `persist adr create` already replaces a skill, which is why `create-adr` is
  retired in ADR-0008. Rejected as a complete answer because it means every deterministic operation
  any skill might want must first become a shipped, versioned CLI command. That is a much higher bar
  than a script, and it makes user-authored skills second-class.
- **Scripts only in user-authored skills, never in catalog skills.** Rejected. It creates two
  classes of skill with different rules, and the user writing their own script gets less scrutiny
  than the one we ship — precisely backwards.
- **Keep the rule unchanged.** Rejected. It is the single largest remaining source of avoidable
  context cost, and the reasoning behind it was about MVP scope, not a permanent principle.

## Consequences

**Improves.** Deterministic work executes instead of being re-derived. Context cost of a triggered
skill drops further than ADR-0008 achieves alone. Skill quality becomes testable — a script can have
tests; a paragraph of instructions cannot.

**Worsens.** `persist init` can now write executable files into a user's repository. That is a real
change in the product's security posture and must be stated plainly in the README and the security
model rather than buried. Reviewers of generated output have more to review.

**Risks.** The main risk is scope creep: scripts that reach the network, mutate state outside the
repository, or grow into an application. The four constraints above are the guard, and they need
tests that fail loudly rather than documentation that asks nicely.

**Required on acceptance.** Accepting this ADR means running
`persist adr supersede skill-generation-portable-and-scriptless "Generated Skills May Ship Scripts"`
and removing the _"Do not add scripts inside generated skills for MVP"_ line from `CLAUDE.md` and
`AGENTS.md`. Until both happen, the repository contradicts itself.

## Supersedes

- ADR-0004-skill-generation-portable-and-scriptless

## Related Documents

- Product: `docs/00-product/PRODUCT.md`
- Architecture: `docs/ai/AI_AGENTS_SKILLS_MCP_STRATEGY.md`
- Security: `docs/20-security/SECURITY_MODEL.md`, `docs/20-security/THREAT_MODEL.md`
- Feature: `docs/40-features/F-023-skill-generation/`
- Supersedes: [ADR-0004](ADR-0004-skill-generation-portable-and-scriptless.md)
