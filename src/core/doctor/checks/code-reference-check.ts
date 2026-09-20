import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import type { DoctorCheckContext, DoctorCheckOutcome, DoctorFinding } from "../doctor-check.js";

const featureFolderPattern = /^F-\d{3,}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const adrFilePattern = /^ADR-\d{4,}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u;

const CONVENTIONS_DOC = "60-engineering/CONVENTIONS.md";
const COMPLETION_REPORT = "COMPLETION_REPORT.md";

// Only current-state docs are checked. A feature folder containing a completion report is
// history: its planning docs describe what was built at the time and must not be flagged
// when code is later deleted. Completion reports and reviews are never scanned for the
// same reason.
const FEATURE_DOCS = ["PRD.md", "ARCHITECTURE_IMPACT.md"];
const MODULE_DOCS = ["MODULE.md", "DECISIONS.md"];

// An inline-code token that looks like a concrete source path: under src/ or tests/, with a file
// extension. Placeholder-bearing paths (`<id>`, globs, `...`) are skipped so illustrative paths do
// not false-positive.
const codePathPattern = /`((?:src|tests)\/[A-Za-z0-9._/-]+\.[A-Za-z0-9]+)`/gu;
const placeholderMarkers = /[<>*]|\.\.\./u;

/**
 * Deterministic memory-to-code drift check.
 *
 * Flags current-state memory that cites a `src/` or `tests/` path which no longer exists, so stale
 * documentation that references renamed or deleted code is surfaced rather than silently trusted.
 */
export type CodeReferenceCheckResult = {
  findings: DoctorFinding[];
  outcome: DoctorCheckOutcome;
};

export async function checkCodeReferences(
  context: DoctorCheckContext,
): Promise<CodeReferenceCheckResult> {
  if (context.config === undefined) {
    return notEvaluated("Code reference checks require Persist OS config.");
  }

  const featureEntries = await readDirIfExists(context.rootDir, context.config.featuresDir);
  const hasFeatures = featureEntries.some(
    (folder) => folder.isDirectory() && featureFolderPattern.test(folder.name),
  );
  const moduleEntries = await readDirIfExists(context.rootDir, context.config.modulesDir);
  const hasModules = moduleEntries.some((folder) => folder.isDirectory());
  const adrEntries = await readDirIfExists(context.rootDir, context.config.adrDir);
  const adrFiles = adrEntries.filter((entry) => entry.isFile() && adrFilePattern.test(entry.name));
  const conventionsPath = path.posix.join(context.config.docsDir, CONVENTIONS_DOC);
  const conventions = await readFileIfExists(context.rootDir, conventionsPath);

  if (!hasFeatures && !hasModules && adrFiles.length === 0 && conventions === undefined) {
    return notEvaluated(
      "no ADRs, conventions, feature folders, or module folders exist, so there is no memory to scan for code references",
    );
  }

  const findings: DoctorFinding[] = [];

  for (const adrFile of adrFiles) {
    const relativePath = path.posix.join(context.config.adrDir, adrFile.name);
    findings.push(...(await checkDoc(context.rootDir, relativePath)));
  }

  if (conventions !== undefined) {
    findings.push(...(await checkDoc(context.rootDir, conventionsPath)));
  }

  for (const folder of featureEntries) {
    if (!folder.isDirectory() || !featureFolderPattern.test(folder.name)) {
      continue;
    }
    const featureDir = path.posix.join(context.config.featuresDir, folder.name);
    if (await isCompletedFeature(context.rootDir, featureDir)) {
      continue;
    }
    for (const doc of FEATURE_DOCS) {
      const relativePath = path.posix.join(featureDir, doc);
      findings.push(...(await checkDoc(context.rootDir, relativePath)));
    }
  }

  for (const folder of moduleEntries) {
    if (!folder.isDirectory()) {
      continue;
    }
    for (const doc of MODULE_DOCS) {
      const relativePath = path.posix.join(context.config.modulesDir, folder.name, doc);
      findings.push(...(await checkDoc(context.rootDir, relativePath)));
    }
  }

  return { findings, outcome: { id: "code-references", status: "evaluated" } };
}

/**
 * A feature with a completion report is treated as history, whether or not the report claims
 * completion: the report's presence marks the folder as a record of shipped work rather than
 * current-state planning.
 */
async function isCompletedFeature(rootDir: string, featureDir: string): Promise<boolean> {
  return (
    (await readFileIfExists(rootDir, path.posix.join(featureDir, COMPLETION_REPORT))) !== undefined
  );
}

function notEvaluated(reason: string): CodeReferenceCheckResult {
  return {
    findings: [],
    outcome: { id: "code-references", status: "not-evaluated", reason },
  };
}

async function checkDoc(rootDir: string, relativePath: string): Promise<DoctorFinding[]> {
  const content = await readFileIfExists(rootDir, relativePath);
  if (content === undefined) {
    return [];
  }

  const findings: DoctorFinding[] = [];
  const seen = new Set<string>();

  for (const match of content.matchAll(codePathPattern)) {
    const reference = match[1];
    if (placeholderMarkers.test(reference) || seen.has(reference)) {
      continue;
    }
    seen.add(reference);

    if (!existsSync(path.join(rootDir, reference))) {
      findings.push({
        severity: "warning",
        check: "drift-code-reference",
        message: `Repository memory references ${reference}, which does not exist.`,
        path: relativePath,
      });
    }
  }

  return findings;
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
    return await readFile(path.join(rootDir, relativePath), "utf8");
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}
