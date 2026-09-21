export type SkillScript = {
  /** Repo-relative path inside the skill directory, e.g. `scripts/scan-secrets.sh`. */
  path: string;
  content: string;
  executable: boolean;
};

export type SkillDefinition = {
  name: string;
  title: string;
  /** WHAT the skill does and WHEN it activates. The router: read before the body loads. */
  description: string;
  /** One sentence: the single job this skill performs. */
  goal: string;
  /** Only inputs that are not obvious. Omitted when everything the skill needs is obvious. */
  inputs?: string[];
  /** 5–10 numbered steps. */
  workflow: string[];
  /** If X → do Y. Omitted when the workflow has no branches worth naming. */
  decisions?: string[];
  /** How the agent knows it is done. */
  verification: string[];
  /** One-hop links (`For X → docs/...`) followed only when the workflow reaches them. */
  resources: string[];
  /** What the skill hands back. */
  output: string[];
  /** Optional executable companions. A skill must work with these deleted. */
  scripts?: SkillScript[];
};

const SECRET_SCAN_SCRIPT = `#!/bin/sh
# scan-secrets.sh — read-only scan of a diff for candidate secrets.
#
# Usage: scan-secrets.sh [--staged | --file PATH]
#
# Reads the staged diff by default, or a unified diff file with --file PATH.
# Prints matching lines and exits 1 when candidates are found; exits 0 when
# clean. Reads only: it runs git and grep, writes nothing, and opens no
# connections.
set -eu

MODE="staged"
TARGET=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --staged)
      MODE="staged"
      ;;
    --file)
      MODE="file"
      TARGET="\${2:?missing path after --file PATH}"
      ;;
    *)
      printf 'usage: scan-secrets.sh [--staged | --file PATH]\\n'
      exit 2
      ;;
  esac
  shift
done

PATTERN='BEGIN [A-Z ]*PRIVATE KEY|AKIA[0-9A-Z]{16}|xox[bpas]-[0-9A-Za-z-][0-9A-Za-z-]*|ghp_[0-9A-Za-z]{36}|password[[:space:]]*[:=][[:space:]]*["'\\'']'

if [ "$MODE" = "file" ]; then
  MATCHES="$(grep -nEi -e "$PATTERN" -- "$TARGET" || true)"
else
  MATCHES="$(git diff --cached | grep -nEi -e "$PATTERN" || true)"
fi

if [ -z "$MATCHES" ]; then
  printf 'scan-secrets: no candidate secrets found.\\n'
  exit 0
fi

printf 'scan-secrets: candidate secrets found:\\n'
printf '%s\\n' "$MATCHES"
exit 1
`;

/**
 * Built-in catalog of Persist OS workflow skills (ADR-0008).
 *
 * Five skills, rewritten from scratch against the progressive-disclosure shape: no
 * `Required Reading`, resources as one-hop links, earned sections, and explicit
 * verification and output. Descriptions carry WHAT and WHEN with trigger language so
 * agents invoke them at the right moment.
 */
export const SKILL_CATALOG: SkillDefinition[] = [
  {
    name: "plan-feature",
    title: "Plan Feature",
    description:
      "Turn approved requirements into an implementation plan with tasks and a test plan. Use when planning a substantial feature from approved requirements before any implementation begins. Skip for small local changes (implement directly with focused tests), security reviews, and convention checks.",
    goal: "Turn approved requirements into an ordered implementation plan without writing implementation code.",
    inputs: [
      "Approved requirements or feature PRD.",
      "Acceptance criteria.",
      "Known constraints or release target.",
    ],
    workflow: [
      "Restate the objective and acceptance criteria in one paragraph.",
      "Identify the affected modules, docs, templates, and tests.",
      "Record architecture impact and whether a new ADR is needed (propose it; never accept it yourself).",
      "Break the work into ordered tasks, each with explicit completion evidence.",
      "Derive the test plan from acceptance criteria, risks, and likely regressions.",
      "Stop before implementation and hand back the PLAN, TASKS, and TEST_PLAN paths.",
    ],
    decisions: [
      "If requirements are missing or contradictory → stop and ask for them.",
      "If a task would change accepted non-goals → stop and ask for approval.",
      "If the request is a small local fix → skip this skill and implement directly with focused tests.",
    ],
    verification: [
      "PLAN.md states the objective, scope, and architecture impact.",
      "Every task maps to an acceptance criterion or a stated risk.",
      "No implementation code was written.",
    ],
    resources: [
      "For completion evidence rules → docs/50-quality/QUALITY_GATES.md",
      "For engineering rules → docs/60-engineering/ENGINEERING_STANDARDS.md",
      "For sensitive scope → docs/20-security/SECURITY_MODEL.md",
      "For prior decisions → docs/adrs/",
      "For module ownership, when module memory is enabled → docs/30-modules/",
    ],
    output: [
      "Paths of the PLAN.md, TASKS.md, and TEST_PLAN.md files written.",
      "One-paragraph summary of scope and the recommended first task.",
    ],
  },
  {
    name: "security-review",
    title: "Security Review",
    description:
      "Review a change for security risks before it is accepted. Use when a change touches a trust boundary — file writes, paths, dependencies, stored secrets, network calls, telemetry, MCP, auth — and needs a decision before merging. Skip for feature planning, test writing, and convention checks.",
    goal: "Find security risks in a change before it is accepted.",
    inputs: ["The change as a diff or summary.", "Test results, when they exist."],
    workflow: [
      "Identify changed trust boundaries: file writes, paths, dependencies, auth, stored secrets, network calls, telemetry, MCP.",
      "Run scripts/scan-secrets.sh over the staged diff and treat matches as blockers until cleared. If scripts/ is unavailable (deleted or cannot execute), perform the same scan by reading the diff directly.",
      "Check validation wherever user-controlled input reaches a file path, query, shell command, or template.",
      "Check new dependencies and configuration changes for risk.",
      "Check that tests cover the security-sensitive behavior.",
      "Classify findings as blockers, risks, or documented tradeoffs.",
      "Hand back the verdict with the finding list.",
    ],
    decisions: [
      "If a credential is present in the change → blocker; stop and ask for its removal.",
      "If user-controlled input reaches a path, query, or shell command unvalidated → blocker.",
      "If the change conflicts with accepted repository memory → stop and ask for a human decision.",
    ],
    verification: [
      "Every trust boundary the change touches has a finding or an explicit all-clear.",
      "Blockers name the exact file and line.",
      "No finding is generic filler.",
    ],
    resources: [
      "For the security model → docs/20-security/SECURITY_MODEL.md",
      "For threat context, when present → docs/20-security/THREAT_MODEL.md",
    ],
    output: [
      "Verdict: accept, accept with risks, or block.",
      "Finding list with files, lines, and severity.",
    ],
    scripts: [
      {
        path: "scripts/scan-secrets.sh",
        content: SECRET_SCAN_SCRIPT,
        executable: true,
      },
    ],
  },
  {
    name: "conventions-adherence",
    title: "Conventions Adherence",
    description:
      "Check a change against the repository's naming conventions and canonical vocabulary instead of reinventing patterns. Use when reviewing a finished change, or before finishing one, to verify it reuses what CONVENTIONS.md names. Skip for planning work, security reviews, and writing new tests.",
    goal: "Verify a change reuses the repository's named vocabulary instead of inventing new patterns.",
    workflow: [
      "Review with fresh context: a separate pass from the one that wrote the change.",
      "Read the Canonical Primitives, Naming Conventions, Rules, and Anti-Patterns sections of CONVENTIONS.md.",
      "For each new component, helper, client, type, or pattern, check whether a named primitive already exists.",
      "Check naming against the documented conventions.",
      "Flag reinvention, divergent naming, and anti-pattern use, each naming the primitive or rule.",
      "Propose a CONVENTIONS.md update when the change establishes a genuinely new shared primitive.",
    ],
    decisions: [
      "If CONVENTIONS.md is missing or still a template → report that first; there is nothing to review against.",
      "If a convention conflicts with an accepted ADR → the ADR wins; stop and ask for a human decision.",
    ],
    verification: [
      "Every finding cites a specific primitive, naming rule, or anti-pattern.",
      "Reinvention of an existing primitive is caught or explicitly absent.",
      "New shared primitives are proposed for documentation, not silently accepted.",
    ],
    resources: [
      "For the vocabulary → docs/60-engineering/CONVENTIONS.md",
      "For past mistakes → docs/60-engineering/LESSONS.md",
    ],
    output: [
      "Finding list citing primitives or rules, or an explicit all-clear.",
      "Proposed CONVENTIONS.md update when one earned it.",
    ],
  },
  {
    name: "chestertons-fence",
    title: "Chesterton's Fence",
    description:
      "Reason about a fence crossing — a change to source logic with no recorded reason for its current shape. Use when a Chesterton fence warning fires on a staged change, when a diff touches logic that looks deliberate but unexplained, or when writing the human-confirmed reason to FENCES.md. Skip for planning work, security reviews, and convention checks.",
    goal: "Decide whether the existing logic is deliberate and record the human-confirmed reason in FENCES.md.",
    inputs: [
      "The staged change or diff the fence warning named.",
      "Access to the human who knows the constraint; name them in the record.",
    ],
    workflow: [
      "List which staged files the fence warning names and read the current logic in each.",
      "For each file, state what the logic does today and what simpler shape tempts the change.",
      "Ask the human why the logic is shaped this way; never infer the constraint from the code.",
      'When the human confirms a real constraint, record it with `persist fence add <path> --why "<reason>" --by <name>`; never hand-write the entry, because the readers parse an exact shape.',
      "When the behaviour is accidental rather than deliberate, say so and record nothing.",
      "Append the crossing to the entry history with the date, the outcome, and who confirmed it.",
      "Verify the entry against the Verification list and hand back the per-file outcome.",
    ],
    decisions: [
      "If the change is a bug fix → answer one question only: was this behaviour intentional?",
      "If the human does not know or will not confirm → record nothing; a confident guess is worse than an empty file.",
      "If the logic is accidental, not deliberate → say so plainly; no fence entry.",
    ],
    verification: [
      "Every staged file the warning named has an outcome: fenced, accidental, or deferred.",
      "Each fence entry names the human who confirmed the reason.",
      "No Why was inferred from code alone; every reason traces to a human answer.",
      "Each entry was written by `persist fence add`, so the shape the readers parse is guaranteed.",
    ],
    resources: ["For recorded fences and their history → docs/60-engineering/FENCES.md"],
    output: [
      "Outcome per file: fence recorded, accidental (no record), or deferred to a human.",
      "The FENCES.md entry written, or an explicit statement that nothing was recorded.",
    ],
  },
  {
    name: "adr-compliance",
    title: "ADR Compliance",
    description:
      "Check that a change follows the accepted ADRs governing the files it touches. Use when changing code in an area an ADR governs, before calling work done, or when persist doctor names a governing ADR for a changed file. Skip for writing a new ADR (use persist adr create), planning, and convention or security reviews.",
    goal: "Prove every accepted ADR that governs a change is followed, or stop before a conflict lands.",
    inputs: [
      "The change: the staged diff, or the commits not yet pushed.",
      "The accepted ADRs in docs/adrs/; superseded ones no longer bind.",
    ],
    workflow: [
      "Find the governing ADRs: run `persist doctor` and take the ADRs it names for the changed files, then search the accepted ADRs for each changed path, its directory, and the domain it touches (money, auth, storage) and add any that match.",
      "Read each governing ADR's Decision section in full, not just its title, and rewrite it as short rules a line of code can pass or fail.",
      "Review with fresh context: a separate pass, or a sub-agent given only the diff and those rules, never the conversation that wrote the change.",
      "Check every added or changed line against every rule and quote the line for each finding. Judge the operation itself; a comment, name, or summary that claims compliance is not evidence.",
      "Check for new dependencies, services, storage, or public interfaces that no accepted ADR covers; each one is a decision to record, not a detail.",
      "Mark each rule: follows, conflicts (quote the line), or unclear (say what would settle it).",
      "Resolve every conflict before calling the work done, as the Decisions below say.",
    ],
    decisions: [
      "If a line conflicts with an ADR → change the code to follow it; never edit an accepted ADR to fit the code.",
      "If the ADR looks wrong for this change → stop and ask a human; once they agree, record it with `persist adr supersede <old> <new-title>`.",
      "If a decision is too vague to check → report it as unclear and propose sharper wording and an Applies To list; do not guess.",
      "If the change makes a decision no ADR records → propose one with `persist adr create`; never accept it yourself.",
      "If no accepted ADR governs the change → say so explicitly; that is a valid all-clear.",
    ],
    verification: [
      "Every governing ADR has a verdict, or the review states that none govern the change.",
      "Every conflict quotes the file, the line, and the rule it breaks.",
      "No verdict rests on a comment, a name, or the author's summary; each rests on the code.",
      "No accepted ADR was edited; any changed decision went through `persist adr supersede`.",
    ],
    resources: [
      "For accepted decisions and the paths each one governs (its Applies To section) → docs/adrs/",
    ],
    output: [
      "Per ADR: follows, conflicts (with quoted lines), or unclear.",
      "What was fixed, or the human decision still needed.",
    ],
  },
  {
    name: "context",
    title: "Context Lookup",
    description:
      "Find and record area memory through context cards. Use when starting work in an area with history, when a task names code whose reasons live outside the source, or when finishing work the next task here should find. Skip for small fixes with no reusable reasoning, security reviews, and release planning.",
    goal: "Start from recorded area memory instead of rediscovery, and leave the next task a better card.",
    workflow: [
      'Run `persist context "<task>"` before starting, phrasing the task the way it was asked.',
      "Read only what the matches point at: the Start Here paths first, then the Rules and Pitfalls lines they name.",
      "When no card covers the task, read the closest decisions and fences the output names instead.",
      "Do the work, then check the diff against the pointed-at rules before calling it done.",
      'When done, create or refresh the area card: `persist context add <name> --purpose "<one line>"` for a new area, otherwise edit the existing card directly.',
      "Add the finished task to the card Answers list, phrased the way it was asked.",
      'Run `persist context "<task>"` again to confirm the card is found before calling the work done.',
    ],
    decisions: [
      "If the lookup names no card and no decision → say so; an empty result is a valid answer.",
      "If the area has no card yet → scaffold one with `persist context add`; never overwrite an existing card.",
      "If the card's pointers contradict the code → the code wins today; update the card and say so.",
    ],
    verification: [
      "The lookup ran before any source file was read for the task.",
      "Only pointed-at files were read; no surrounding directory was explored.",
      "The card Answers list holds the finished task in its asked phrasing.",
      "A repeat lookup finds the card for that phrasing.",
    ],
    resources: ["For area memory, when present → docs/context/"],
    output: [
      "The card found and the pointed-at files read, or an explicit statement that none covers the task.",
      "The card created or updated, with the new Answers line quoted.",
    ],
  },
];

export function getCatalogSkill(name: string): SkillDefinition | undefined {
  return SKILL_CATALOG.find((skill) => skill.name === name);
}

export function listCatalogSkillNames(): string[] {
  return SKILL_CATALOG.map((skill) => skill.name);
}
