import { checkCodeReferences } from "./checks/code-reference-check.js";
import { checkConfig } from "./checks/config-check.js";
import { checkContent } from "./checks/content-check.js";
import { checkContextBudget } from "./checks/context-budget-check.js";
import { checkConventions } from "./checks/conventions-check.js";
import { checkDrift } from "./checks/drift-check.js";
import { checkHookDrift } from "./checks/hook-drift-check.js";
import { checkMemoryIntegrity } from "./checks/memory-integrity-check.js";
import { checkRequiredFiles } from "./checks/required-files-check.js";
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
  check: string;
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

export type DoctorCheck = (
  context: DoctorCheckContext,
) => Promise<DoctorFinding[]> | DoctorFinding[];

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
] as const;

export async function runDoctor(rootDir: string): Promise<DoctorReport> {
  const findings: DoctorFinding[] = [];
  const checks: DoctorCheckOutcome[] = [];
  const configResult = await checkConfig(rootDir);

  findings.push(...configResult.findings);
  checks.push({ check: "config", status: "evaluated" });

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
  checks.push({ check: "required-files", status: "evaluated" });

  if (configResult.config === undefined) {
    const reason = gatedChecksReason(configResult.findings);
    for (const check of CONFIG_GATED_CHECKS) {
      checks.push({ check, status: "not-evaluated", reason });
    }
    return createDoctorReport(findings, checks);
  }

  findings.push(...(await checkMemoryIntegrity(context)));
  checks.push({ check: "memory-integrity", status: "evaluated" });
  findings.push(...(await checkStandards(context)));
  checks.push({ check: "standards", status: "evaluated" });
  findings.push(...(await checkDrift(context)));
  checks.push({ check: "drift", status: "evaluated" });
  findings.push(...(await checkContent(context)));
  checks.push({ check: "content", status: "evaluated" });
  findings.push(...(await checkConventions(context)));
  checks.push({ check: "conventions", status: "evaluated" });
  findings.push(...(await checkCodeReferences(context)));
  checks.push({ check: "code-references", status: "evaluated" });
  findings.push(...(await checkSuperseded(context)));
  checks.push({ check: "superseded", status: "evaluated" });
  findings.push(...(await checkContextBudget(context)));
  checks.push({ check: "context-budget", status: "evaluated" });
  findings.push(...(await checkStaleness(context)));
  checks.push({ check: "staleness", status: "evaluated" });

  const hookDrift = await checkHookDrift(context);
  findings.push(...hookDrift.findings);
  checks.push(hookDrift.outcome);

  return createDoctorReport(findings, checks);
}

function gatedChecksReason(configFindings: DoctorFinding[]): string {
  const message = configFindings[0]?.message ?? "";

  if (message.includes("not valid JSON")) {
    return "config .persist/config.json is not valid JSON, so configured paths are unknown";
  }

  if (message.includes("Missing .persist/config.json")) {
    return "no .persist/config.json, so configured paths are unknown";
  }

  return "invalid .persist/config.json, so configured paths are unknown";
}

export function createDoctorReport(
  findings: DoctorFinding[],
  checks: DoctorCheckOutcome[] = [],
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
