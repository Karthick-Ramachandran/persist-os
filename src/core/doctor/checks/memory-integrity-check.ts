import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";

import type { DoctorCheckContext, DoctorFinding } from "../doctor-check.js";

const featureFolderPattern = /^F-\d{3,}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const adrFilePattern = /^ADR-\d{4,}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u;

const requiredFeatureDocs = [
  "PRD.md",
  "ACCEPTANCE.md",
  "ARCHITECTURE_IMPACT.md",
  "CHANGE_REQUESTS.md",
  "PLAN.md",
  "TASKS.md",
  "TEST_PLAN.md",
  "REVIEW.md",
  "COMPLETION_REPORT.md"
];

const requiredModuleDocs = ["MODULE.md", "TASKS.md", "TEST_PLAN.md", "DECISIONS.md"];

const requiredAdrSections = [
  "## Status",
  "## Context",
  "## Decision",
  "## Alternatives Considered",
  "## Consequences",
  "## Related Documents"
];

export async function checkMemoryIntegrity(
  context: DoctorCheckContext
): Promise<DoctorFinding[]> {
  if (context.config === undefined) {
    return [];
  }

  const findings: DoctorFinding[] = [];

  findings.push(...(await checkFeatureFolders(context.rootDir, context.config.featuresDir)));
  findings.push(...(await checkModuleFolders(context.rootDir, context.config.modulesDir)));
  findings.push(...(await checkAdrFiles(context.rootDir, context.config.adrDir)));

  return findings;
}

async function checkFeatureFolders(
  rootDir: string,
  featuresDir: string
): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  const entries = await readDirIfExists(rootDir, featuresDir);
  const featureFolders = entries.filter(
    (entry) => entry.isDirectory() && featureFolderPattern.test(entry.name)
  );

  for (const featureFolder of featureFolders) {
    for (const requiredDoc of requiredFeatureDocs) {
      const filePath = path.posix.join(featuresDir, featureFolder.name, requiredDoc);
      if (!(await isFile(rootDir, filePath))) {
        findings.push({
          severity: "error",
          check: "feature-memory",
          message: "Feature folder is missing a required doc.",
          path: filePath
        });
      }
    }
  }

  findings.push({
    severity: "info",
    check: "feature-memory",
    message: `${featureFolders.length} feature folders detected.`
  });

  return findings;
}

async function checkModuleFolders(
  rootDir: string,
  modulesDir: string
): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  const entries = await readDirIfExists(rootDir, modulesDir);
  const moduleFolders = entries.filter((entry) => entry.isDirectory());

  for (const moduleFolder of moduleFolders) {
    for (const requiredDoc of requiredModuleDocs) {
      const filePath = path.posix.join(modulesDir, moduleFolder.name, requiredDoc);
      if (!(await isFile(rootDir, filePath))) {
        findings.push({
          severity: "error",
          check: "module-memory",
          message: "Module folder is missing a required doc.",
          path: filePath
        });
      }
    }
  }

  findings.push({
    severity: "info",
    check: "module-memory",
    message: `${moduleFolders.length} module folders detected.`
  });

  return findings;
}

async function checkAdrFiles(rootDir: string, adrDir: string): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  const entries = await readDirIfExists(rootDir, adrDir);
  const adrFiles = entries.filter((entry) => entry.isFile() && adrFilePattern.test(entry.name));

  for (const adrFile of adrFiles) {
    const filePath = path.posix.join(adrDir, adrFile.name);
    const content = await readFile(path.join(rootDir, filePath), "utf8");

    for (const requiredSection of requiredAdrSections) {
      if (!content.includes(requiredSection)) {
        findings.push({
          severity: "error",
          check: "adr-memory",
          message: `ADR file is missing required section ${requiredSection}.`,
          path: filePath
        });
      }
    }
  }

  findings.push({
    severity: "info",
    check: "adr-memory",
    message: `${adrFiles.length} ADRs detected.`
  });

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

async function isFile(rootDir: string, relativePath: string): Promise<boolean> {
  try {
    return (await lstat(path.join(rootDir, relativePath))).isFile();
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

