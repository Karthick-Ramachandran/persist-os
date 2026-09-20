import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { REQUIRED_ADR_SECTIONS } from "../../adr/adr-sections.js";
import type { DoctorCheckContext, DoctorCheckOutcome, DoctorFinding } from "../doctor-check.js";

const featureFolderPattern = /^F-\d{3,}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const adrFilePattern = /^ADR-\d{4,}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u;

const requiredModuleDocs = ["MODULE.md", "TASKS.md", "TEST_PLAN.md", "DECISIONS.md"];

const requiredAdrSections = REQUIRED_ADR_SECTIONS;

export type MemoryIntegrityCheckResult = {
  findings: DoctorFinding[];
  outcome: DoctorCheckOutcome;
};

export async function checkMemoryIntegrity(
  context: DoctorCheckContext,
): Promise<MemoryIntegrityCheckResult> {
  if (context.config === undefined) {
    return notEvaluated("Memory integrity checks require Persist OS config.");
  }

  const { rootDir, config } = context;
  const featureFolders = await listFeatureFolders(rootDir, config.featuresDir);
  const moduleFolders = await listModuleFolders(rootDir, config.modulesDir);
  const adrFiles = await listAdrFiles(rootDir, config.adrDir);

  if (featureFolders.length === 0 && moduleFolders.length === 0 && adrFiles.length === 0) {
    return notEvaluated(
      "no feature folders, module folders, or ADRs exist, so there is no memory to validate",
    );
  }

  const findings: DoctorFinding[] = [];

  // Minimal scaffold (ADR-0007): PLAN.md and TASKS.md always; TEST_PLAN.md only while the
  // test gate enforces it. Older nine-document folders contain all three, so they keep passing.
  const requiredFeatureDocs =
    config.testCommand === undefined || config.testCommand === null
      ? ["PLAN.md", "TASKS.md"]
      : ["PLAN.md", "TASKS.md", "TEST_PLAN.md"];

  findings.push(...(await checkFeatureFolders(rootDir, config.featuresDir, requiredFeatureDocs)));
  findings.push(...(await checkModuleFolders(rootDir, config.modulesDir)));
  findings.push(...(await checkAdrFiles(rootDir, config.adrDir)));

  return { findings, outcome: { id: "memory-integrity", status: "evaluated" } };
}

function notEvaluated(reason: string): MemoryIntegrityCheckResult {
  return {
    findings: [],
    outcome: { id: "memory-integrity", status: "not-evaluated", reason },
  };
}

async function listFeatureFolders(rootDir: string, featuresDir: string): Promise<string[]> {
  const entries = await readDirIfExists(rootDir, featuresDir);
  return entries
    .filter((entry) => entry.isDirectory() && featureFolderPattern.test(entry.name))
    .map((entry) => entry.name);
}

async function listModuleFolders(rootDir: string, modulesDir: string): Promise<string[]> {
  const entries = await readDirIfExists(rootDir, modulesDir);
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

async function listAdrFiles(rootDir: string, adrDir: string): Promise<string[]> {
  const entries = await readDirIfExists(rootDir, adrDir);
  return entries
    .filter((entry) => entry.isFile() && adrFilePattern.test(entry.name))
    .map((entry) => entry.name);
}

async function checkFeatureFolders(
  rootDir: string,
  featuresDir: string,
  requiredFeatureDocs: string[],
): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  const entries = await readDirIfExists(rootDir, featuresDir);
  const featureFolders = entries.filter(
    (entry) => entry.isDirectory() && featureFolderPattern.test(entry.name),
  );

  for (const featureFolder of featureFolders) {
    for (const requiredDoc of requiredFeatureDocs) {
      const filePath = path.posix.join(featuresDir, featureFolder.name, requiredDoc);
      if (!(await isFile(rootDir, filePath))) {
        findings.push({
          severity: "error",
          check: "feature-memory",
          message: "Feature folder is missing a required doc.",
          path: filePath,
        });
      }
    }
  }

  findings.push({
    severity: "info",
    check: "feature-memory",
    message: `${featureFolders.length} feature folders detected.`,
  });

  return findings;
}

async function checkModuleFolders(rootDir: string, modulesDir: string): Promise<DoctorFinding[]> {
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
          path: filePath,
        });
      }
    }
  }

  findings.push({
    severity: "info",
    check: "module-memory",
    message: `${moduleFolders.length} module folders detected.`,
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
          path: filePath,
        });
      }
    }
  }

  findings.push({
    severity: "info",
    check: "adr-memory",
    message: `${adrFiles.length} ADRs detected.`,
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
