import { checkCodeReferences } from "./checks/code-reference-check.js";
import { checkConfig } from "./checks/config-check.js";
import { checkContent } from "./checks/content-check.js";
import { checkContextBudget } from "./checks/context-budget-check.js";
import { checkConventions } from "./checks/conventions-check.js";
import { checkDrift } from "./checks/drift-check.js";
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

export type DoctorReport = {
  findings: DoctorFinding[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
};

export type DoctorCheckContext = {
  rootDir: string;
  config?: {
    docsDir: string;
    featuresDir: string;
    modulesDir: string;
    adrDir: string;
  };
};

export type DoctorCheck = (
  context: DoctorCheckContext,
) => Promise<DoctorFinding[]> | DoctorFinding[];

export async function runDoctor(rootDir: string): Promise<DoctorReport> {
  const findings: DoctorFinding[] = [];
  const configResult = await checkConfig(rootDir);

  findings.push(...configResult.findings);

  const context: DoctorCheckContext = {
    rootDir,
    config: configResult.config,
  };

  findings.push(...(await checkRequiredFiles(context)));

  if (configResult.config !== undefined) {
    findings.push(...(await checkMemoryIntegrity(context)));
    findings.push(...(await checkStandards(context)));
    findings.push(...(await checkDrift(context)));
    findings.push(...(await checkContent(context)));
    findings.push(...(await checkConventions(context)));
    findings.push(...(await checkCodeReferences(context)));
    findings.push(...(await checkSuperseded(context)));
    findings.push(...(await checkContextBudget(context)));
    findings.push(...(await checkStaleness(context)));
  }

  return createDoctorReport(findings);
}

export function createDoctorReport(findings: DoctorFinding[]): DoctorReport {
  return {
    findings,
    summary: {
      errors: findings.filter((finding) => finding.severity === "error").length,
      warnings: findings.filter((finding) => finding.severity === "warning").length,
      info: findings.filter((finding) => finding.severity === "info").length,
    },
  };
}
