# ADR-0019: The Fence Counts Only an Accepted ADR Reference

## Status

Accepted

## Context

ADR-0010 says a change to in-scope source with "no fence record, no ADR reference" warns. The
fence check read "ADR reference" as the changed path appearing as a substring anywhere in any
`.md` file directly under the ADR directory. That accepts far more than a recorded reason: any
status counts (a Proposed draft, a Rejected one, or one superseded by a later decision clears
the fence like an Accepted one), any `.md` file counts (the index, the template), and a
substring counts (naming src/lib/money.tsx clears a change to src/lib/money.ts).

Seen in a real run: an agent changed three source files, the fence warned on all three, the
agent wrote a Proposed ADR naming those files, and the warnings disappeared. No human had
confirmed why any of them is shaped that way. In an unattended run the fence can be quieted in
the same commit as the risky change it exists to surface — and a file of confident guesses is
exactly what ADR-0010 rules out for `FENCES.md`.

## Decision

"ADR reference" in ADR-0010 means an Accepted, not superseded ADR naming the changed path as a
whole path. Nothing else clears the fence:

- **What counts as an ADR:** numbered files (`ADR-0007-<slug>.md`) directly under the ADR
  directory, plus proposals under `<adrDir>/proposed/` (`ADR-PROPOSED-<slug>.md`), which count
  as Proposed. Nothing else in the folder counts.
- **Status:** the one shared status reader decides. Accepted and not superseded clears the
  fence; Proposed is reported for review as info; anything else warns exactly as before.
- **Path match:** the path must appear whole — not glued to a longer path on either side. A
  `:line` suffix still counts; backticked, bulleted, and bare mentions all still count.
- **Several ADRs:** any Accepted naming wins; otherwise the lowest-numbered Proposed ADR is
  named in the info finding.

The fence stays read-only with no new configuration, the warning stays a warning (ADR-0013),
and the finding is an ordinary info finding under the `fence` check id (ADR-0011). A Proposed
ADR never clears the fence, and no ADR is ever written just to quiet a warning.

## Applies To

- `src/core/doctor/checks/fence-check.ts`

## Alternatives Considered

- **Keep the substring rule.** Rejected: it cannot tell a human-confirmed reason from a draft
  naming the file, which is the distinction the fence exists to surface.
- **Let a Proposed ADR clear the fence.** Rejected: a proposal is not yet a decision anyone
  confirmed, and clearing on it rewards writing the draft in the same commit as the change.
- **Block on the warning instead.** Rejected (ADR-0010, ADR-0013): a gate whose satisfaction
  condition is "an agent wrote something plausible" teaches people to write something
  plausible.
- **Match `Applies To` patterns as references.** Rejected: a decision governing a folder does
  not explain why each function in it is shaped a particular way, and it does not today
  either. The governing-ADRs check already names that decision.

## Consequences

**Improves.** The fence can again tell "a human confirmed why this code is shaped this way"
from "an agent named the file in a draft", including in unattended runs.

**Worsens.** Nothing for repositories whose ADRs are all Accepted: their verdicts resolve
byte-identically, since an Accepted whole-path mention cleared the fence before and still
does.

**Risks.** Changes previously quieted by a draft or a near-miss mention warn again until an
Accepted ADR or a fence entry records the reason. That is the intended noise: each warning is
a reason nobody wrote down.

## Related Documents

- Related: [ADR-0010](ADR-0010-chestertons-fence.md),
  [ADR-0011](ADR-0011-one-zero-stability-contract.md),
  [ADR-0013](ADR-0013-warnings-are-advisory-in-the-generated-pre-commit-hook.md),
  [ADR-0017](ADR-0017-any-stack-test-detection-and-quieter-fence.md)

This ADR refines ADR-0010 and does not supersede it.
