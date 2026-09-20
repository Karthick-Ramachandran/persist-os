# ADR-0008: Skill Architecture Progressive Disclosure

## Status

Accepted

## Context

Persist OS ships 12 catalog skills. Their structure is not the problem — they already carry a name,
a description, inputs, a process, stop conditions, and a quality bar, which is close to the shape
the Agent Skills ecosystem has converged on.

One section undoes all of it.

Every skill has `## Required Reading`. Counted across the catalog:

```txt
9 × docs/60-engineering/ENGINEERING_STANDARDS.md
7 × docs/20-security/SECURITY_MODEL.md
5 × docs/10-architecture/ARCHITECTURE.md
4 × docs/10-architecture/FILE_WRITE_POLICY.md
```

`plan-feature` mandates eight documents before step one. So a skill whose own body is roughly 400
tokens expands into something closer to 15,000 the moment it triggers.

That is the exact inversion of progressive disclosure. Claude, Codex, and Cursor have all converged
on three levels: metadata always available, `SKILL.md` loaded on trigger, resources loaded only when
needed. `## Required Reading` is a level-three resource list written as a level-one mandate.

Two further problems follow from how the skills are produced. `render-skill.ts` stamps every skill
with an identical fixed section template, so each one gets every heading whether that heading earns
its place or not. And there is no lazy tier at all — no `references/`, no `scripts/` — so anything
that should be fetched on demand is inline prose instead.

Several skills also duplicate work the CLI already does deterministically. `create-adr` teaches an
agent to hand-write what `persist adr create` produces reliably; `create-prd` does the same for a
document that ADR-0007 removes from the default set. A skill that re-implements a tested command by
hand is strictly worse than the command.

## Decision

The catalog shrinks from 12 skills to 3, and all three are rewritten rather than edited.

**Retired:** `create-prd`, `create-adr`, `plan-module`, `implement-task`, `write-tests`,
`update-module-memory`, `completion-report`, `capture-mcp-context`, and `architecture-drift-review`.

**Kept, rewritten from scratch:** `plan-feature`, `security-review`, `conventions-adherence`.

None of the three survives as-is. Each is rewritten against this structure:

```md
---
name: skill-name
description: WHAT it does. WHEN it should activate.
---

# Goal

One sentence.

## Inputs

Only inputs that are not obvious.

## Workflow

5–10 numbered steps.

## Decisions

If X → do Y.

## Verification

How the agent knows it is done.

## Resources

For X → docs/....

## Output

What the skill returns.
```

Four rules govern the rewrite:

1. **`## Required Reading` is deleted.** Documents are referenced from `## Resources` as one-hop
   links the agent follows only when the workflow reaches them.
2. **References point at `docs/`, not at a skill-local `references/` directory.** Persist OS already
   generates the reference layer; duplicating it inside skills would create two copies of repository
   truth that drift apart.
3. **The description carries WHAT and WHEN.** It is the router — it is read before the body is
   loaded, so triggering conditions belong there, not in a `## When to use` section the model only
   sees after it has already decided.
4. **Sections are earned.** `render-skill.ts` stops emitting a fixed template; a skill only gets a
   heading when it has content for it.

Skills gain a `## Verification` section stating how the agent knows the work is complete, and an
`## Output` section stating what it returns. Neither exists today, and without them a skill finishes
when the agent feels finished.

Target size is 150–600 words per `SKILL.md`. That is a ceiling, not a goal.

## Alternatives Considered

- **Keep 12 skills and delete only `Required Reading`.** Rejected. It fixes the token problem but
  leaves skills that duplicate CLI commands, and skills tied to documents ADR-0007 removes.
- **Keep one skill unchanged to reduce risk.** Considered. Rejected because every surviving skill
  needs `Verification` and `Output`, which none currently has, so "unchanged" would mean shipping a
  skill that does not meet the new contract.
- **Skill-local `references/` directories.** Rejected for repository-bound skills, which can point
  at `docs/`. Reconsider only if skills ever need to be portable outside the repository that
  generated them.
- **Let skills stay large and rely on the model to skim.** Rejected. Context spent is context spent
  whether or not the model attends to it.

## Consequences

**Improves.** A triggered skill costs its own body rather than its body plus eight documents. Nine
fewer skills to maintain, version, and keep consistent with the docs. Agents get explicit completion
criteria for the first time.

**Worsens.** Retiring nine skills removes capability that some users may rely on. The workflow those
skills encoded moves into `AGENTS.md` and the CLI, which is a different shape and will need
explaining. Existing repositories keep the retired skills on disk until they choose to delete them.

**Risks.** A rewritten description that routes worse than the original is a silent failure — the
skill simply never triggers. Each surviving skill needs trigger tests: prompts that must activate
it, and prompts that must not.

## Related Documents

- Product: `docs/00-product/PRODUCT.md`
- Architecture: `docs/ai/AI_AGENTS_SKILLS_MCP_STRATEGY.md`
- Security: `docs/20-security/SECURITY_MODEL.md`
- Feature: `docs/40-features/F-023-skill-generation/`
- Related: [ADR-0007](ADR-0007-minimal-by-default-repository-memory.md),
  [ADR-0012](ADR-0012-generated-skills-may-ship-scripts.md)
