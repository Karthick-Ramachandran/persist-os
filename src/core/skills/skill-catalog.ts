export type SkillDefinition = {
  name: string;
  title: string;
  description: string;
  purpose: string[];
  inputs: string[];
  requiredReading: string[];
  outputFiles: string[];
  process: string[];
  extraSections?: { heading: string; bullets: string[] }[];
  stopConditions: string[];
  qualityBar: string[];
};

/**
 * Built-in catalog of Persist OS workflow skills.
 *
 * Each skill is portable (standard Agent Skills fields only) and contains no scripts, so the same
 * SKILL.md works across Claude Code and other Agent Skills-compatible tools. Descriptions include
 * "Use when ..." trigger language so agents invoke them at the right moment.
 */
export const SKILL_CATALOG: SkillDefinition[] = [
  {
    name: "create-prd",
    title: "Create PRD",
    description:
      "Create or update a feature PRD with user intent, scope, acceptance criteria, non-goals, security notes, test expectations, and source-of-truth links. Use when starting a feature, drafting or updating a PRD, or defining acceptance criteria.",
    purpose: [
      "Create a useful feature PRD that helps humans and AI agents understand what should be built and why.",
    ],
    inputs: [
      "Feature name or problem statement.",
      "User goal or business reason.",
      "Any existing product notes, tickets, or change requests.",
    ],
    requiredReading: [
      "`docs/00-product/BRD.md`",
      "`docs/00-product/PRD.md`",
      "Relevant existing `docs/40-features/<feature>/`",
      "Relevant accepted ADRs in `docs/adrs/`",
    ],
    outputFiles: [
      "`docs/40-features/<feature>/PRD.md`",
      "`docs/40-features/<feature>/ACCEPTANCE.md`, when acceptance criteria are part of the request.",
      "`docs/40-features/<feature>/CHANGE_REQUESTS.md`, when changing existing requirements.",
    ],
    process: [
      "Identify the user, problem, desired outcome, and non-goals.",
      "Link the feature to product goals and existing source-of-truth docs.",
      "Define acceptance criteria that can be tested.",
      "Capture security, privacy, file write, dependency, and MCP implications.",
      "Identify architecture areas that require follow-up review.",
      "Keep the PRD concise and implementation-guiding.",
    ],
    stopConditions: [
      "Product intent is contradictory.",
      "A requested behavior conflicts with an accepted ADR.",
      "The feature adds network, telemetry, AI API, cloud, MCP runtime, auth, secrets, or file write behavior without explicit approval.",
      "Scope is too broad to define testable acceptance criteria.",
    ],
    qualityBar: [
      "The PRD states goals, non-goals, users, acceptance criteria, risks, and source links.",
      "Acceptance criteria are concrete enough to drive tests.",
      "Security and architecture implications are not generic filler.",
      "The PRD does not duplicate full architecture docs.",
    ],
  },
  {
    name: "plan-feature",
    title: "Plan Feature",
    description:
      "Plan a feature from approved requirements by producing implementation tasks, architecture impact, test plan, review expectations, and completion evidence. Use when turning an approved PRD into a plan, tasks, and a test plan.",
    purpose: [
      "Turn product intent into a scoped engineering plan that an implementation agent can follow safely.",
    ],
    inputs: [
      "Feature PRD.",
      "Acceptance criteria.",
      "Relevant module or architecture docs.",
      "Known constraints or release target.",
    ],
    requiredReading: [
      "`docs/10-architecture/ARCHITECTURE.md`",
      "`docs/10-architecture/FILE_WRITE_POLICY.md`",
      "`docs/20-security/SECURITY_MODEL.md`",
      "`docs/50-quality/QUALITY_GATES.md`",
      "`docs/60-engineering/ENGINEERING_STANDARDS.md`",
      "Relevant feature docs under `docs/40-features/`",
      "Relevant module docs under `docs/30-modules/`",
      "Relevant ADRs under `docs/adrs/`",
    ],
    outputFiles: [
      "`docs/40-features/<feature>/PLAN.md`",
      "`docs/40-features/<feature>/TASKS.md`",
      "`docs/40-features/<feature>/ARCHITECTURE_IMPACT.md`",
      "`docs/40-features/<feature>/TEST_PLAN.md`",
    ],
    process: [
      "Restate the feature objective and acceptance criteria.",
      "Identify modules, docs, templates, and tests affected.",
      "Document architecture impact and ADR needs.",
      "Break work into ordered tasks with clear completion evidence.",
      "Define tests from requirements, risk, security invariants, and regressions.",
      "For module requests, treat the module as a mini product and create feature delivery docs before implementation tasks.",
    ],
    stopConditions: [
      "Requirements are missing or contradictory.",
      "Architecture impact cannot be determined.",
      "The plan conflicts with engineering standards.",
      "A task requires changing accepted non-goals.",
      "A module request tries to start implementation before PRD, acceptance, architecture impact, test plan, and tasks exist.",
    ],
    qualityBar: [
      "Tasks are ordered and independently reviewable.",
      "Tests map to acceptance criteria and risks.",
      "Architecture impact is explicit.",
      "Engineering standards are accounted for in tasks and completion evidence.",
      "The plan does not include implementation code when only planning is requested.",
    ],
  },
  {
    name: "plan-module",
    title: "Plan Module",
    description:
      "Plan a module as a mini product by creating feature delivery docs, module memory, acceptance criteria, architecture impact, test plan, and ordered tasks before implementation. Use when asked to build, create, redesign, or materially change a module.",
    purpose: [
      "Turn a module request into a complete delivery workflow before implementation starts.",
    ],
    inputs: [
      "Module name or request.",
      "Product goal or user need.",
      "Existing architecture, feature, or module docs.",
      "Known constraints or priority stage.",
    ],
    requiredReading: [
      "`AGENTS.md`",
      "`docs/00-product/PRD.md`",
      "`docs/10-architecture/ARCHITECTURE.md`",
      "`docs/20-security/SECURITY_MODEL.md`",
      "`docs/50-quality/TESTING_STRATEGY.md`",
      "`docs/60-engineering/ENGINEERING_STANDARDS.md`",
      "`docs/ai/MODULE_DELIVERY_WORKFLOW.md`",
      "Relevant ADRs under `docs/adrs/`",
    ],
    outputFiles: [
      "`docs/40-features/F-###-<module>-module/` delivery docs (PRD, ACCEPTANCE, ARCHITECTURE_IMPACT, PLAN, TASKS, TEST_PLAN, REVIEW, COMPLETION_REPORT).",
      "`docs/30-modules/<module>/MODULE.md`",
      "`docs/30-modules/<module>/TASKS.md`",
      "`docs/30-modules/<module>/TEST_PLAN.md`",
      "`docs/30-modules/<module>/DECISIONS.md`",
    ],
    process: [
      "Create a module brief: ownership, non-ownership, public interfaces, users, and use cases.",
      "Define behavior and edge cases.",
      "Write testable acceptance criteria.",
      "Document architecture impact, dependency impact, config impact, template impact, and ADR needs.",
      "Write the test plan from acceptance criteria, security invariants, and regression risk.",
      "Break work into ordered tasks with status, scope, acceptance, tests, and do-not-do boundaries.",
      "Mark implementation as blocked until the first task is selected.",
    ],
    stopConditions: [
      "The module ownership or public interface is unclear.",
      "The module conflicts with accepted ADRs or architecture docs.",
      "The module conflicts with engineering standards.",
      "The module requires runtime network, telemetry, cloud, MCP, AI API, auth, secrets, storage, or file write behavior changes without ADR or security review.",
      "The user asks to implement before PRD, acceptance, architecture impact, test plan, and tasks exist.",
    ],
    qualityBar: [
      "The module is planned as a mini product, not a file list.",
      "PRD, acceptance, architecture impact, test plan, and tasks are all present.",
      "Tasks are small enough to execute one at a time.",
      "Module memory captures what future agents need to remember.",
      "No implementation code is written by this skill.",
    ],
  },
  {
    name: "create-adr",
    title: "Create ADR",
    description:
      "Create an Architecture Decision Record for a meaningful architecture, dependency, security, file-write, MCP, or workflow decision. Use when recording such a decision so future agents do not contradict it.",
    purpose: [
      "Record durable architecture decisions so future humans and agents do not rediscover or contradict them.",
    ],
    inputs: [
      "Decision topic.",
      "Context and constraints.",
      "Options considered.",
      "Recommended or selected decision.",
    ],
    requiredReading: [
      "`docs/10-architecture/ARCHITECTURE.md`",
      "`docs/10-architecture/FILE_WRITE_POLICY.md`",
      "`docs/20-security/SECURITY_MODEL.md`",
      "Relevant existing ADRs in `docs/adrs/`",
    ],
    outputFiles: ["`docs/adrs/ADR-####-<slug>.md`"],
    process: [
      "Determine whether the change needs an ADR.",
      "Find the next ADR number without reusing existing numbers.",
      "Write context, decision, alternatives, consequences, and related docs.",
      "Mark the status as `Proposed` unless the human has accepted the decision.",
      "Link to affected PRDs, architecture docs, feature docs, and security docs.",
    ],
    stopConditions: [
      "The decision changes security posture, network behavior, telemetry, file writes, auth, secrets, cloud, or runtime MCP.",
      "The requested decision conflicts with an accepted ADR.",
      "The decision is not actually made yet and should remain a proposal.",
    ],
    qualityBar: [
      "The ADR explains why the decision exists, not just what changed.",
      "Alternatives and consequences are honest.",
      "Status is clear.",
      "Related documents are linked.",
    ],
  },
  {
    name: "implement-task",
    title: "Implement Task",
    description:
      "Implement one scoped engineering task while preserving requirements, architecture boundaries, security posture, tests, docs, and completion evidence. Use when implementing a single task from an approved plan.",
    purpose: ["Implement a bounded task safely from approved requirements and plans."],
    inputs: [
      "Task description.",
      "Feature plan or acceptance criteria.",
      "Relevant module and architecture docs.",
    ],
    requiredReading: [
      "`AGENTS.md`",
      "`docs/10-architecture/ARCHITECTURE.md`",
      "`docs/10-architecture/FILE_WRITE_POLICY.md`",
      "`docs/20-security/SECURITY_MODEL.md`",
      "`docs/60-engineering/ENGINEERING_STANDARDS.md`",
      "Relevant feature, module, and ADR docs.",
    ],
    outputFiles: [
      "Implementation files for the scoped task.",
      "Tests for changed behavior.",
      "Updated module, feature, or completion docs when behavior changes.",
    ],
    process: [
      "Confirm the task has clear acceptance criteria.",
      "Confirm the task comes after PRD, acceptance, architecture impact, and test plan.",
      "Identify affected modules and tests.",
      "Implement the smallest safe change.",
      "Add or update tests based on risk.",
      "Reuse the primitives `docs/60-engineering/CONVENTIONS.md` already names; record a new reusable primitive there when you create one, instead of leaving it undocumented.",
      "Add a short entry to `docs/60-engineering/LESSONS.md` when something broke non-obviously or a tempting approach turned out wrong, so it is not rediscovered next session.",
      "Update docs when behavior, architecture, or module ownership changes.",
      "Prepare completion evidence with commands and results.",
    ],
    stopConditions: [
      "The task conflicts with source-of-truth docs.",
      "The task conflicts with engineering standards.",
      "The task requires adding runtime network, telemetry, cloud, MCP, AI API, or generated production app behavior without review.",
      "A dependency is needed without ADR consideration.",
      "Tests cannot be designed from the available requirements.",
    ],
    qualityBar: [
      "Scope stays narrow.",
      "Tests cover behavior and risk.",
      "File write and security rules are preserved.",
      "Engineering standards are followed.",
      "Completion evidence is concrete.",
      "One task is implemented at a time.",
    ],
  },
  {
    name: "write-tests",
    title: "Write Tests",
    description:
      "Write meaningful tests from acceptance criteria, risk, security invariants, module boundaries, and regression history. Use when adding or updating tests, writing a test plan, or covering a new feature or bug fix.",
    purpose: ["Create professional tests that prove important behavior, not random happy paths."],
    inputs: [
      "Feature PRD or task.",
      "Acceptance criteria.",
      "Changed files or planned modules.",
      "Known risks.",
    ],
    requiredReading: [
      "`docs/50-quality/TESTING_STRATEGY.md`",
      "`docs/50-quality/QUALITY_GATES.md`",
      "`docs/20-security/SECURITY_MODEL.md`",
      "`docs/60-engineering/ENGINEERING_STANDARDS.md`",
      "Relevant feature `TEST_PLAN.md`",
      "Relevant module `TEST_PLAN.md`",
    ],
    outputFiles: [
      "Test files under the appropriate `tests/` area.",
      "Updated `TEST_PLAN.md` when test strategy changes.",
      "Completion evidence listing commands and results.",
    ],
    process: [
      "Map acceptance criteria to test cases.",
      "Add risk-based tests for unsafe paths, overwrites, symlinks, config validation, generated output, and CLI behavior as relevant.",
      "Prefer unit tests for pure logic and integration tests for command behavior.",
      "Add golden tests for generated docs and templates.",
      "Name tests by behavior.",
      "Document skipped tests and remaining risk.",
    ],
    stopConditions: [
      "Requirements are not testable.",
      "The requested test would require runtime network, telemetry, cloud, MCP, or AI API behavior without review.",
      "Security-sensitive behavior lacks a documented expected result.",
      "The test approach conflicts with engineering standards.",
    ],
    qualityBar: [
      "Tests derive from requirements and risk.",
      "Security invariants are covered.",
      "Test names describe behavior.",
      "Engineering standards for evidence and skipped checks are followed.",
      "The completion report includes commands and results.",
    ],
  },
  {
    name: "security-review",
    title: "Security Review",
    description:
      "Review a change for file write safety, path traversal, symlink risk, overwrite behavior, dependencies, secrets, telemetry, network, MCP, and supply chain risk. Use when reviewing a change for security before it is accepted.",
    purpose: ["Find security risks before a change is accepted."],
    inputs: [
      "Change summary or diff.",
      "Feature docs.",
      "Architecture and security docs.",
      "Test results.",
    ],
    requiredReading: [
      "`docs/20-security/SECURITY_MODEL.md`",
      "`docs/20-security/THREAT_MODEL.md`",
      "`docs/10-architecture/FILE_WRITE_POLICY.md`",
      "`docs/60-engineering/ENGINEERING_STANDARDS.md`",
      "`docs/ai/MCP_STRATEGY.md`",
    ],
    outputFiles: [
      "Relevant feature `REVIEW.md`",
      "Relevant feature `COMPLETION_REPORT.md`",
      "Security docs, if the accepted behavior changes.",
    ],
    process: [
      "Review with fresh, independent context — a separate pass, or a dedicated sub-agent if your tool supports one — rather than continuing in the same chat that wrote the change, so the review is not biased by the work it checks.",
      "Identify changed trust boundaries.",
      "Check path validation, overwrite policy, symlink policy, and dry-run behavior.",
      "Check dependency, package, template, and preset risk.",
      "Check for network, telemetry, secrets, `.env`, cloud, AI API, or runtime MCP behavior.",
      "Check tests for security-sensitive behavior.",
      "Classify findings as blockers, risks, or documented acceptable tradeoffs.",
    ],
    stopConditions: [
      "Runtime network, telemetry, cloud, MCP, AI API, auth, secrets, storage, or file write behavior changes without ADR or security review.",
      "Existing files can be overwritten by default.",
      "Writes can escape the project root.",
      "Secrets could be read, logged, or generated into docs.",
      "Engineering standards are bypassed for secrets, dependencies, migrations, tests, or completion evidence.",
    ],
    qualityBar: [
      "Findings are specific and actionable.",
      "Security claims cite docs or test evidence.",
      "Remaining risks are explicit.",
    ],
  },
  {
    name: "architecture-drift-review",
    title: "Architecture Drift Review",
    description:
      "Review a change for undocumented architecture, dependency, module, security, testing, or documentation drift. Use when checking whether a change diverges from accepted repository memory.",
    purpose: [
      "Find changes that diverge from accepted repository memory.",
      "Drift is not difference from a Persist OS recommendation. Persist OS is architecture-neutral.",
    ],
    inputs: ["Change summary or diff.", "Feature docs.", "Module docs.", "ADRs.", "Test results."],
    requiredReading: [
      "`docs/10-architecture/ARCHITECTURE.md`",
      "`docs/60-engineering/ENGINEERING_STANDARDS.md`",
      "`docs/20-security/SECURITY_MODEL.md`",
      "Relevant `docs/30-modules/<module>/MODULE.md`",
      "Relevant `docs/40-features/<feature>/PRD.md`",
      "Relevant `docs/adrs/*.md`",
    ],
    outputFiles: [
      "Relevant feature `REVIEW.md`",
      "Relevant feature `COMPLETION_REPORT.md`",
      "Updated docs only when the human accepts documented evolution.",
    ],
    process: [
      "Review with fresh, independent context — a separate pass, or a dedicated sub-agent if your tool supports one — rather than continuing in the same chat that wrote the change, so the review is not biased by the work it checks.",
      "Review the change and identify changed modules and generated outputs.",
      "Compare changes against accepted ADRs and repository decisions.",
      "Compare changes against module boundaries.",
      "Check for new dependencies and security-sensitive changes.",
      "Check whether tests and docs were updated.",
      "Classify findings.",
    ],
    extraSections: [
      {
        heading: "Finding Types",
        bullets: [
          "Architecture drift",
          "Dependency drift",
          "Module drift",
          "Security drift",
          "Testing drift",
          "Documentation drift",
          "Engineering standards drift",
          "Acceptable documented evolution",
        ],
      },
    ],
    stopConditions: [
      "An accepted ADR conflicts with the implementation.",
      "The implementation conflicts with engineering standards.",
      "A dependency was added without ADR consideration.",
      "Authentication, authorization, storage, networking, secrets, telemetry, cloud, runtime MCP, or file write behavior changed without security review.",
      "Feature behavior changed without a PRD or change request update.",
    ],
    qualityBar: [
      "Findings distinguish drift from documented evolution.",
      "Findings compare against accepted repository memory, not Persist OS preferences.",
      "Each blocker names the missing source-of-truth update.",
      "Review output is concrete enough to act on.",
    ],
  },
  {
    name: "update-module-memory",
    title: "Update Module Memory",
    description:
      "Update module memory docs after module behavior, ownership, boundaries, tests, risks, or decisions change. Use when a module's behavior, ownership, boundaries, tests, risks, or decisions change.",
    purpose: [
      "Keep module docs accurate so agents do not rediscover ownership, boundaries, tests, and decisions.",
    ],
    inputs: [
      "Changed module or feature.",
      "Implementation summary.",
      "Test results.",
      "Architecture or ADR changes.",
    ],
    requiredReading: [
      "`docs/60-engineering/ENGINEERING_STANDARDS.md`",
      "`docs/ai/MODULE_DELIVERY_WORKFLOW.md`",
      "Relevant `docs/30-modules/<module>/MODULE.md`",
      "Relevant `docs/30-modules/<module>/DECISIONS.md`",
      "Relevant feature docs and ADRs.",
    ],
    outputFiles: [
      "`docs/30-modules/<module>/MODULE.md`",
      "`docs/30-modules/<module>/TASKS.md`",
      "`docs/30-modules/<module>/TEST_PLAN.md`",
      "`docs/30-modules/<module>/DECISIONS.md`",
    ],
    process: [
      "Identify affected modules.",
      "Confirm module memory is linked to feature delivery docs when the module is new or materially changed.",
      "Update module purpose, responsibilities, non-responsibilities, public interfaces, and boundaries when behavior changes.",
      "Update task status only when supported by completion evidence.",
      "Update test expectations when risks or behavior change.",
      "Record decisions or link ADRs when architecture changes.",
      "Avoid copying full feature docs into module docs.",
    ],
    stopConditions: [
      "Module ownership is unclear.",
      "A change crosses module boundaries without architecture review.",
      "Module memory updates would conflict with engineering standards.",
      "A decision belongs in an ADR instead of a module note.",
      "Feature delivery docs are missing for new module work.",
    ],
    qualityBar: [
      "Module docs are concise and current.",
      "Boundaries are clear.",
      "Test expectations are actionable.",
      "Decisions link to ADRs where appropriate.",
      "Future agents can tell what the module owns and what it must not own.",
    ],
  },
  {
    name: "completion-report",
    title: "Completion Report",
    description:
      "Write a completion report with files changed, tests run, results, skipped checks, docs updated, remaining risks, and release readiness notes. Use when recording evidence that a task or feature is complete and ready for review.",
    purpose: ["Record evidence that a task is complete and safe to review."],
    inputs: [
      "Task or feature summary.",
      "Files changed.",
      "Commands run.",
      "Test results.",
      "Docs updated.",
      "Known risks.",
    ],
    requiredReading: [
      "`docs/50-quality/QUALITY_GATES.md`",
      "`docs/60-engineering/ENGINEERING_STANDARDS.md`",
      "Relevant feature `TASKS.md`",
      "Relevant feature `TEST_PLAN.md`",
      "Relevant feature `REVIEW.md`",
    ],
    outputFiles: [
      "Relevant feature `COMPLETION_REPORT.md`",
      "Task or feature docs that need final status updates.",
    ],
    process: [
      "Summarize the completed scope.",
      "List files changed by category.",
      "List commands run and results.",
      "List skipped checks and why.",
      "List docs updated.",
      "State whether engineering standards were followed.",
      "List remaining risks and follow-up work.",
      "State whether the task meets the definition of done.",
    ],
    stopConditions: [
      "Test results are missing for risky changes.",
      "Completion claims conflict with evidence.",
      "Required docs were not updated.",
      "Engineering standards were violated.",
      "Remaining risks are release blockers.",
    ],
    qualityBar: [
      "The report is evidence-based.",
      "It does not hide skipped checks.",
      "It separates completed work from remaining risk.",
      "A reviewer can decide what to do next from the report alone.",
    ],
  },
  {
    name: "conventions-adherence",
    title: "Conventions Adherence",
    description:
      "Review a change for reuse of the repository's canonical vocabulary instead of reinventing components, helpers, or patterns. Use when reviewing a change, or before finishing one, to check it follows the repository conventions.",
    purpose: [
      "Keep AI output consistent by reusing the named primitives and rules the repository already defined, instead of inventing new ones.",
      "Adherence is measured against this repository's own CONVENTIONS.md, not against any Persist OS preference. Persist OS is architecture-neutral.",
    ],
    inputs: [
      "Change summary or diff.",
      "The repository conventions.",
      "Relevant feature, module, and architecture docs.",
    ],
    requiredReading: [
      "`docs/60-engineering/CONVENTIONS.md`",
      "`docs/60-engineering/ENGINEERING_STANDARDS.md`",
      "`docs/60-engineering/LESSONS.md`",
      "Relevant `docs/30-modules/<module>/MODULE.md`",
    ],
    outputFiles: [
      "Relevant feature `REVIEW.md`",
      "A proposed `docs/60-engineering/CONVENTIONS.md` update when a new canonical primitive or rule is genuinely established (human accepts it).",
    ],
    process: [
      "Review with fresh, independent context — a separate pass, or a dedicated sub-agent if your tool supports one — rather than continuing in the same chat that wrote the change, so the review is not biased by the work it checks.",
      "Read CONVENTIONS.md so you know the canonical primitives, naming, rules, and anti-patterns.",
      "For each new component, helper, client, type, or pattern in the change, check whether a canonical primitive already exists that should have been reused.",
      "Check naming against the documented conventions.",
      "Check the change against the falsifiable rules and anti-patterns.",
      "Flag reinvention of an existing primitive, divergent naming, and anti-pattern use as findings, each naming the primitive or rule that applies.",
      "If the change establishes a genuinely new shared primitive or rule, propose adding it to CONVENTIONS.md rather than leaving it undocumented.",
    ],
    stopConditions: [
      "CONVENTIONS.md is missing or still an unfilled template, so there is nothing to review against — report that the conventions need to be filled first.",
      "Following a convention would conflict with an accepted ADR or engineering standards.",
    ],
    qualityBar: [
      "Findings cite a specific primitive, naming rule, or anti-pattern from CONVENTIONS.md.",
      "Reinvention of an existing primitive is caught.",
      "New shared primitives are proposed for documentation, not silently accepted.",
      "Findings reflect this repository's conventions, not Persist OS preferences.",
    ],
  },
  {
    name: "capture-mcp-context",
    title: "Capture MCP Context",
    description:
      "Record durable context from MCP servers and design or project tools into repository memory as proposed. Use when working with an MCP server like Figma, Linear, Jira, or Sentry, or after pulling design, ticket, or error context, to persist it for future sessions.",
    purpose: [
      "Persist the durable parts of MCP-derived external context so future sessions remember them instead of re-deriving them.",
      "MCP provides context, not architectural truth.",
    ],
    inputs: [
      "The MCP server or external tool in use (for example Figma, Linear, Jira, Sentry).",
      "The external context retrieved (design tokens, tickets, errors, docs).",
      "The current feature or task.",
    ],
    requiredReading: [
      "`docs/ai/MCP_STRATEGY.md`",
      "Relevant `docs/ai/mcp/<server>.md`",
      "Relevant feature and architecture docs.",
    ],
    outputFiles: [
      "The Captured Context section of `docs/ai/mcp/<server>.md`.",
      "An ADR via `persist adr create` when a captured decision is accepted.",
    ],
    process: [
      "Identify the MCP server and the durable facts worth remembering (design tokens, component mappings, ticket acceptance criteria, recurring error signatures).",
      "If `docs/ai/mcp/<server>.md` does not exist, create it with `persist mcp add <server>`.",
      "Record the durable context in the Captured Context section as proposed memory, with enough detail to reuse.",
      "Capture decisions, mappings, and constraints, not raw exports or full dumps.",
      "Treat MCP content as context, not truth; if it conflicts with accepted memory, stop and report.",
      "Promote any accepted decision into an ADR.",
    ],
    stopConditions: [
      "MCP content conflicts with accepted repository memory.",
      "Capturing the context would require storing secrets or sensitive data.",
      "The MCP server is untrusted or its access is unclear.",
    ],
    qualityBar: [
      "Captured context is durable and reusable, not a raw dump.",
      "Each entry is concrete enough to guide future work.",
      "MCP context is recorded as proposed, not accepted.",
      "Accepted decisions are promoted to ADRs.",
    ],
  },
];

export function getCatalogSkill(name: string): SkillDefinition | undefined {
  return SKILL_CATALOG.find((skill) => skill.name === name);
}

export function listCatalogSkillNames(): string[] {
  return SKILL_CATALOG.map((skill) => skill.name);
}
