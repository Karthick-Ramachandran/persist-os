import { isPresentFile } from "../../filesystem/present-file.js";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import type { DoctorCheckContext, DoctorCheckOutcome, DoctorFinding } from "../doctor-check.js";

const featureFolderPattern = /^F-\d{3,}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const adrFilePattern = /^ADR-\d{4,}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u;

const securitySensitivePattern =
  /\b(auth|authentication|authorization|secrets?|storage|networking?|telemetry|file writes?|write policy|dependencies?|mcp|ai api|cloud|runtime)\b/iu;

export type StandardsCheckResult = {
  findings: DoctorFinding[];
  outcome: DoctorCheckOutcome;
};

export async function checkStandards(context: DoctorCheckContext): Promise<StandardsCheckResult> {
  if (context.config === undefined) {
    return notEvaluated("Standards checks require Persist OS config.");
  }

  const { rootDir, config } = context;
  const featureEntries = await readDirIfExists(rootDir, config.featuresDir);
  const hasFeatures = featureEntries.some(
    (entry) => entry.isDirectory() && featureFolderPattern.test(entry.name),
  );
  const adrEntries = await readDirIfExists(rootDir, config.adrDir);
  const hasAdrs = adrEntries.some((entry) => entry.isFile() && adrFilePattern.test(entry.name));

  if (!hasFeatures && !hasAdrs) {
    return notEvaluated(
      "no feature folders or ADRs exist, so there are no completion claims or decisions to check",
    );
  }

  const findings: DoctorFinding[] = [];

  findings.push(...(await checkFeatureStandards(rootDir, config.featuresDir)));
  findings.push(...(await checkAdrStandards(rootDir, config.adrDir)));
  findings.push(...(await checkAdrAlternatives(rootDir, config.adrDir)));
  findings.push(...(await checkAdrSecurityNotes(rootDir, config.adrDir)));

  return { findings, outcome: { id: "standards", status: "evaluated" } };
}

function notEvaluated(reason: string): StandardsCheckResult {
  return {
    findings: [],
    outcome: { id: "standards", status: "not-evaluated", reason },
  };
}

async function checkFeatureStandards(
  rootDir: string,
  featuresDir: string,
): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  const entries = await readDirIfExists(rootDir, featuresDir);
  const featureFolders = entries.filter(
    (entry) => entry.isDirectory() && featureFolderPattern.test(entry.name),
  );

  for (const featureFolder of featureFolders) {
    const featureDir = path.posix.join(featuresDir, featureFolder.name);
    const completionReportPath = path.posix.join(featureDir, "COMPLETION_REPORT.md");
    const reviewPath = path.posix.join(featureDir, "REVIEW.md");
    const architectureImpactPath = path.posix.join(featureDir, "ARCHITECTURE_IMPACT.md");

    const completionReport = await readFileIfExists(rootDir, completionReportPath);
    const review = await readFileIfExists(rootDir, reviewPath);
    const architectureImpact = await readFileIfExists(rootDir, architectureImpactPath);

    if (completionReport !== undefined) {
      const featureIsComplete = sectionContains(completionReport, "Status", /\bcomplete\b/iu);

      if (featureIsComplete) {
        if (review !== undefined && sectionContains(review, "Status", /\bpending\b/iu)) {
          findings.push({
            severity: "error",
            check: "standards-feature-completion",
            message: "Feature is marked complete but review is still pending.",
            path: reviewPath,
          });
        }

        if (!hasMeaningfulSection(completionReport, "Tests Run")) {
          findings.push({
            severity: "error",
            check: "standards-feature-completion",
            message: "Feature is marked complete but completion report is missing test evidence.",
            path: completionReportPath,
          });
        }

        if (!hasMeaningfulSection(completionReport, "Results")) {
          findings.push({
            severity: "error",
            check: "standards-feature-completion",
            message: "Feature is marked complete but completion report is missing result evidence.",
            path: completionReportPath,
          });
        }
      }

      if (architectureImpact !== undefined) {
        findings.push(
          ...checkSecurityImpactEvidence(
            architectureImpact,
            architectureImpactPath,
            featureIsComplete,
          ),
        );
      }
    }
  }

  return findings;
}

async function checkAdrStandards(rootDir: string, adrDir: string): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  const entries = await readDirIfExists(rootDir, adrDir);
  const adrFiles = entries.filter((entry) => entry.isFile() && adrFilePattern.test(entry.name));

  for (const adrFile of adrFiles) {
    const adrPath = path.posix.join(adrDir, adrFile.name);
    const content = await readFile(path.join(rootDir, adrPath), "utf8");
    const isAccepted = sectionContains(content, "Status", /\baccepted\b/iu);

    if (!hasMeaningfulSection(content, "Consequences")) {
      findings.push({
        severity: isAccepted ? "error" : "warning",
        check: "standards-adr-consequences",
        message: "ADR consequence evidence is incomplete.",
        path: adrPath,
      });
    }
  }

  return findings;
}

/**
 * A decision without alternatives: the Alternatives Considered section must carry substance,
 * not just exist (presence alone is memory-integrity's check). Severity mirrors the
 * consequences rule — an accepted ADR with a placeholder here is an error, a proposed one
 * a warning.
 */
async function checkAdrAlternatives(rootDir: string, adrDir: string): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  const entries = await readDirIfExists(rootDir, adrDir);
  const adrFiles = entries.filter((entry) => entry.isFile() && adrFilePattern.test(entry.name));

  for (const adrFile of adrFiles) {
    const adrPath = path.posix.join(adrDir, adrFile.name);
    const content = await readFile(path.join(rootDir, adrPath), "utf8");
    const isAccepted = sectionContains(content, "Status", /\baccepted\b/iu);

    if (!hasMeaningfulSection(content, "Alternatives Considered")) {
      findings.push({
        severity: isAccepted ? "error" : "warning",
        check: "standards-adr-alternatives",
        message: "ADR decision evidence is incomplete.",
        path: adrPath,
      });
    }
  }

  return findings;
}

/**
 * Security-sensitive decisions without security notes: when the Decision section itself uses
 * security-sensitive language, the ADR must point its `Security:` entry under
 * `## Related Documents` at something.
 *
 * That entry is the right anchor because `generate-adr.ts` already emits it in every ADR, so the
 * check asks for a field the tool creates rather than a `## Security` heading it has never
 * produced. Requiring a heading warned on every correctly-written ADR forever; requiring the
 * security prose itself would be circular, since the same vocabulary that marks a decision as
 * security-sensitive would also satisfy the check, and the rule could never fire.
 *
 * Always a warning — erroring would break builds over a heuristic and force edits to accepted
 * history (see F-034 PRD). It confirms the author linked the security memory they considered; a
 * pasted path satisfies it. Judging whether the reasoning is any good is the agent's job.
 */
async function checkAdrSecurityNotes(rootDir: string, adrDir: string): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  const entries = await readDirIfExists(rootDir, adrDir);
  const adrFiles = entries.filter((entry) => entry.isFile() && adrFilePattern.test(entry.name));

  for (const adrFile of adrFiles) {
    const adrPath = path.posix.join(adrDir, adrFile.name);
    const content = await readFile(path.join(rootDir, adrPath), "utf8");
    const decision = getSection(content, "Decision");

    if (decision === undefined || !securitySensitivePattern.test(decision)) {
      continue;
    }

    if (!hasMeaningfulSecurityNotes(content)) {
      findings.push({
        severity: "warning",
        check: "standards-adr-security-notes",
        message:
          "Security-sensitive ADR decision does not link security memory. Fill the `Security:` entry under `## Related Documents`.",
        path: adrPath,
      });
    }
  }

  return findings;
}

/**
 * True when the ADR's `Security:` entry under `## Related Documents` points at something.
 * A missing section, a missing entry, or an entry left as the generated empty placeholder all
 * count as unlinked.
 */
function hasMeaningfulSecurityNotes(content: string): boolean {
  const related = getSection(content, "Related Documents");

  if (related === undefined) {
    return false;
  }

  const entry = /^\s*[-*]\s*Security:\s*(.*)$/imu.exec(related);

  if (entry === null) {
    return false;
  }

  const value = (entry[1] ?? "").trim();

  return value.length > 0 && !isPlaceholder(value);
}

function checkSecurityImpactEvidence(
  architectureImpact: string,
  architectureImpactPath: string,
  featureIsComplete: boolean,
): DoctorFinding[] {
  const contentWithoutSecuritySection = removeSection(architectureImpact, "Security Impact");

  if (!securitySensitivePattern.test(contentWithoutSecuritySection)) {
    return [];
  }

  if (hasMeaningfulSection(architectureImpact, "Security Impact")) {
    return [];
  }

  return [
    {
      severity: featureIsComplete ? "error" : "warning",
      check: "standards-security-impact",
      message: "Security-sensitive feature planning is missing security impact evidence.",
      path: architectureImpactPath,
    },
  ];
}

function sectionContains(content: string, heading: string, pattern: RegExp): boolean {
  const section = getSection(content, heading);
  return section !== undefined && pattern.test(section);
}

function hasMeaningfulSection(content: string, heading: string): boolean {
  const section = getSection(content, heading);
  return section !== undefined && !isPlaceholder(section);
}

function getSection(content: string, heading: string): string | undefined {
  const lines = content.split(/\r?\n/u);
  const startIndex = findSectionStart(lines, heading);

  if (startIndex === -1) {
    return undefined;
  }

  const body: string[] = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (/^##\s+/u.test(lines[index])) {
      break;
    }

    body.push(lines[index]);
  }

  return body.join("\n").trim();
}

function removeSection(content: string, heading: string): string {
  const lines = content.split(/\r?\n/u);
  const startIndex = findSectionStart(lines, heading);

  if (startIndex === -1) {
    return content;
  }

  let endIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (/^##\s+/u.test(lines[index])) {
      endIndex = index;
      break;
    }
  }

  return [...lines.slice(0, startIndex), ...lines.slice(endIndex)].join("\n");
}

function findSectionStart(lines: string[], heading: string): number {
  const normalizedHeading = `## ${heading.toLowerCase()}`;

  return lines.findIndex((line) => line.trim().toLowerCase() === normalizedHeading);
}

function isPlaceholder(value: string): boolean {
  const normalized = value
    .replace(/[`*_>#-]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .toLowerCase()
    .replace(/\.$/u, "");

  if (normalized.length === 0) {
    return true;
  }

  if (
    normalized === "tbd" ||
    normalized === "todo" ||
    normalized === "pending" ||
    normalized === "pending review" ||
    normalized === "draft" ||
    normalized === "none" ||
    normalized === "n/a" ||
    normalized === "not available yet" ||
    normalized === "not run yet"
  ) {
    return true;
  }

  return (
    normalized.includes("implementation is in progress") ||
    normalized.includes("will be completed after implementation")
  );
}

async function readDirIfExists(rootDir: string, relativePath: string) {
  try {
    return await readdir(path.join(rootDir, relativePath), { withFileTypes: true });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function readFileIfExists(
  rootDir: string,
  relativePath: string,
): Promise<string | undefined> {
  try {
    if (!(await isFile(rootDir, relativePath))) {
      return undefined;
    }

    return await readFile(path.join(rootDir, relativePath), "utf8");
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

async function isFile(rootDir: string, relativePath: string): Promise<boolean> {
  // Follows a symlink that stays inside the repository (CLAUDE.md → AGENTS.md is common).
  return isPresentFile(rootDir, relativePath);
}
