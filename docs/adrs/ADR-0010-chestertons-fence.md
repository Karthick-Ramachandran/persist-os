# ADR-0010: Chestertons Fence

## Status

Proposed

## Context

Git records what changed. Persist OS records why. Neither records the reason a piece of code is
_shaped the way it is_ when that reason never rose to the level of an architecture decision.

The motivating case, in the words it was raised in: a write that calls four database collections
instead of one. An agent reads it, concludes one would be simpler, and improves it. The four calls
were deliberate — there was a constraint — but that constraint was never written down, and months
later the person who imposed it has forgotten it too. Nothing in the repository can stop the
"improvement", and nothing will notice until production does.

This is not an architecture decision and no ADR was ever going to exist for it. Requiring an ADR for
every such choice rebuilds exactly the ceremony
[ADR-0007](ADR-0007-minimal-by-default-repository-memory.md) removes. So the mechanism has to work
on repositories with zero ADRs, and it has to stay cheap enough that nobody turns it off.

Chesterton's Fence is the principle: do not remove a fence until you know why it was put there.

## Decision

Persist OS gains a fence: a record of why code is the way it is, which grows through use rather than
being generated up front.

### The record

A single file, `docs/60-engineering/FENCES.md`, holding both the reason and the history of times it
has been challenged. One file rather than a lean index plus a separate log, because there is no
per-edit reader that would be slowed by the history — and an agent that reads a fence benefits from
knowing what happened the last time someone tried to change it. That is what stops a mistake
repeating.

**Fences are never bulk-generated.** Not by `persist init`, not by `persist adopt`, not by an agent
sweeping the codebase. A hundred fences written by something that does not know why the code is that
way is a file nobody trusts and nobody prunes, stale on the day it is created. `FENCES.md` starts
empty.

**A fence is answered by a human.** The agent may draft, but the reason is confirmed by the person
who knows it. The entire premise is that the constraint exists only in someone's memory; an agent
inferring it from the code is guessing, and a file of confident guesses is worse than an empty one.

### Three moments

```txt
INFORM    SessionStart hook injects the fence index.
          Once per session. Counts against the existing 24KB context budget.

TRIGGER   persist adr create / adr supersede.
          Zero cost. Fires before the change. `supersede` is precisely the
          moment a past decision is being revisited.

TRIGGER   Pre-commit, deterministic rule.
          Source file changed, no fence record, no ADR reference → report.
```

There is deliberately **no PreToolUse hook**. A hook firing before every edit is the only mechanism
here with a recurring per-edit cost, and the other two moments cover its ground. The cost of not
having it is that an agent can write a change before learning why it should not have — accepted,
because the SessionStart injection usually means it already knows, and rewriting at commit is
cheaper than taxing every edit for the life of the repository.

### Scope

The deterministic rule treats **any source file as in scope, minus obvious non-logic**: tests,
styles, markdown, lockfiles, generated output, and configuration. No configured path list, no
framework detection. A configured scope is one more thing to set wrong, and a scope set wrong
silently disables the fence without anyone noticing.

### Severity

The rule **warns; it does not block.** Doctor reports it and the commit proceeds.

This is a deliberate departure from how the rest of Persist OS gates, and the reason is that the
fence is the first part of the product whose quality depends on an agent rather than on a
deterministic check. A blocking gate whose satisfaction condition is "an agent wrote something
plausible" is a gate that teaches people to write something plausible. A warning that an agent
reliably acts on is worth more than a block a human learns to bypass.

### The agent's part

A `chestertons-fence` skill performs the reasoning when the rule fires. It answers three questions:
which files are changing, what logic existed there and why, and what might break as a result. It
writes the answer to `FENCES.md`.

**There is no bug-fix exemption.** A bug fix answers one question instead of three — was this
behaviour intentional? — but it still leaves a record. An exemption is a hole, and the whole point
of a fence is that nothing crosses it unrecorded.

`FENCES.md` is fed back to the agent, so the reasoning accumulates rather than being rediscovered.

## Alternatives Considered

- **Trigger on ADR events only.** Free and fires before the change, and it was the strongest
  proposal. Rejected as insufficient on its own: it only catches changes disciplined enough to write
  an ADR first, and the four-collections case never had one. It is kept as one of the three moments,
  not as the only one.
- **A PreToolUse hook on every edit.** Rejected on cost. A cheap path-reject keeps the token cost at
  zero for out-of-scope files, but the process spawn is permanent and the benefit is duplicated by
  the other two moments.
- **`persist adopt` seeds fences from existing code.** Rejected explicitly. It is the bulk
  generation this ADR rules out, and adopt's own principle — propose, never accept — does not help
  when the proposals are guesses about intent.
- **Configured business-logic paths.** Rejected. It adds an init question, drifts as the codebase
  moves, and fails silently when wrong.
- **A commit trailer as the record.** Rejected. Cheapest to check and it travels with git history,
  but it is typed by hand and therefore trivially faked, and it does not accumulate anywhere an
  agent will read it.
- **Blocking rather than warning.** Rejected for 1.0 for the reason given above. Revisit once there
  is evidence about how often the skill produces a real answer versus a plausible one.

## Consequences

**Improves.** The category of knowledge that currently lives only in someone's memory gets a home.
It works on a repository with no ADRs and no ceremony, which is the majority of repositories. Cost
is zero per edit, one injection per session, and one diff comparison per commit.

**Worsens.** `FENCES.md` is a seventh required document when the fence is enabled. The fence is
useless on day one and only becomes valuable as it accumulates, which is a hard thing to demonstrate
in a first run. And it is the first feature whose quality depends on the agent, which makes it the
first feature that can be quietly bad.

**Risks.** The largest is fences full of plausible-sounding guesses — mitigated by requiring a human
answer, but not eliminated, since a human can also wave it through. Warning-only severity means a
team can ignore the fence indefinitely. The "minus obvious non-logic" exclusion list is a heuristic
and will be wrong for some repositories; it needs to be visible and overridable rather than buried.

## Related Documents

- Product: `docs/00-product/PRODUCT.md`
- Architecture: `docs/10-architecture/ARCHITECTURE.md`,
  `docs/10-architecture/REPOSITORY_DECISIONS.md`
- Security: `docs/20-security/SECURITY_MODEL.md`
- Feature: `docs/60-engineering/LESSONS.md`
- Related: [ADR-0003](ADR-0003-persist-adopt-proposes-not-accepts.md),
  [ADR-0006](ADR-0006-adr-accept-promotes-and-removes-the-proposal.md)
