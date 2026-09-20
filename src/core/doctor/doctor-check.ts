import { checkCodeReferences } from "./checks/code-reference-check.js";
import { checkConfig } from "./checks/config-check.js";
import { checkContent } from "./checks/content-check.js";
import { checkContextBudget } from "./checks/context-budget-check.js";
import { checkConventions } from "./checks/conventions-check.js";
import { checkDrift } from "./checks/drift-check.js";
import { checkHookDrift } from "./checks/hook-drift-check.js";
import { checkMemoryIntegrity } from "./checks/memory-integrity-check.js";
import { checkRequiredFiles } from "./checks/required-files-check.js";
import { checkDuplicateTitles } from "./checks/duplicate-titles-check.js";
import { checkRetiredSkills } from "./checks/retired-skills-check.js";
import { checkStaleness } from "./checks/staleness-check.js";
import { checkStandards } from "./checks/standards-check.js";
import { checkSuperseded } from "./checks/superseded-check.js";

export type DoctorSeverity = "error" | "warning" | "info";

export type DoctorFinding = {
  severity: DoctorSeverity;
  check: string;
  message: string;
  path?: string;
};

export type DoctorCheckStatus = "evaluated" | "not-evaluated";

export type DoctorCheckOutcome = {
  /**
   * The check module's id. Deliberately named `id`, not `check`: a finding's `check` field is a
   * finer-grained rule id (`feature-memory`, `content-conventions`) owned by one of these modules,
   * so the two namespaces do not line up and must not look like they do.
   */
  id: string;
  status: DoctorCheckStatus;
  reason?: string;
};

export type DoctorReport = {
  findings: DoctorFinding[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
  checks: DoctorCheckOutcome[];
};

export type DoctorCheckContext = {
  rootDir: string;
  config?: {
    docsDir: string;
    featuresDir: string;
    modulesDir: string;
    adrDir: string;
    aiTools?: string[];
    testCommand?: string | null;
    preCommitGates?: string[];
    prePushGates?: string[];
  };
};

/**
 * Checks that only run once a validated config is available. When the config is missing or
 * invalid these are recorded as not-evaluated instead of silently dropped, so a partial run
 * never looks like a full pass.
 */
const CONFIG_GATED_CHECKS = [
  "memory-integrity",
  "standards",
  "drift",
  "content",
  "conventions",
  "code-references",
  "superseded",
  "context-budget",
  "staleness",
  "hook-drift",
  "retired-skills",
  "duplicate-titles",
] as const;

export async function runDoctor(rootDir: string): Promise<DoctorReport> {
  const findings: DoctorFinding[] = [];
  const checks: DoctorCheckOutcome[] = [];
  const configResult = await checkConfig(rootDir);

  findings.push(...configResult.findings);
  checks.push({ id: "config", status: "evaluated" });

  const context: DoctorCheckContext = {
    rootDir,
    config:
      configResult.config === undefined
        ? undefined
        : {
            docsDir: configResult.config.docsDir,
            featuresDir: configResult.config.featuresDir,
            modulesDir: configResult.config.modulesDir,
            adrDir: configResult.config.adrDir,
            aiTools: [...configResult.config.aiTools],
            testCommand: configResult.config.testCommand,
            preCommitGates: [...configResult.config.preCommitGates],
            prePushGates: [...configResult.config.prePushGates],
          },
  };

  findings.push(...(await checkRequiredFiles(context)));
  checks.push({ id: "required-files", status: "evaluated" });

  if (configResult.config === undefined) {
    const reason =
      configResult.unavailableReason ?? "the Persist OS config is unusable, so paths are unknown";
    for (const check of CONFIG_GATED_CHECKS) {
      checks.push({ id: check, status: "not-evaluated", reason });
    }
    return createDoctorReport(findings, checks);
  }

  const memoryIntegrity = await checkMemoryIntegrity(context);
  findings.push(...memoryIntegrity.findings);
  checks.push(memoryIntegrity.outcome);
  const standards = await checkStandards(context);
  findings.push(...standards.findings);
  checks.push(standards.outcome);
  findings.push(...(await checkDrift(context)));
  checks.push({ id: "drift", status: "evaluated" });
  const content = await checkContent(context);
  findings.push(...content.findings);
  checks.push(content.outcome);
  findings.push(...(await checkConventions(context)));
  checks.push({ id: "conventions", status: "evaluated" });
  const codeReferences = await checkCodeReferences(context);
  findings.push(...codeReferences.findings);
  checks.push(codeReferences.outcome);
  findings.push(...(await checkSuperseded(context)));
  checks.push({ id: "superseded", status: "evaluated" });
  findings.push(...(await checkContextBudget(context)));
  checks.push({ id: "context-budget", status: "evaluated" });

  const staleness = await checkStaleness(context);
  findings.push(...staleness.findings);
  checks.push(staleness.outcome);

  const hookDrift = await checkHookDrift(context);
  findings.push(...hookDrift.findings);
  checks.push(hookDrift.outcome);

  const retiredSkills = await checkRetiredSkills(context);
  findings.push(...retiredSkills.findings);
  checks.push(retiredSkills.outcome);

  const duplicateTitles = await checkDuplicateTitles(context);
  findings.push(...duplicateTitles.findings);
  checks.push(duplicateTitles.outcome);

  return createDoctorReport(findings, checks);
}

export function createDoctorReport(
  findings: DoctorFinding[],
  checks: DoctorCheckOutcome[],
): DoctorReport {
  return {
    findings,
    summary: {
      errors: findings.filter((finding) => finding.severity === "error").length,
      warnings: findings.filter((finding) => finding.severity === "warning").length,
      info: findings.filter((finding) => finding.severity === "info").length,
    },
    checks,
  };
}
