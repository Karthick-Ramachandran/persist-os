import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import type { DoctorCheckContext, DoctorFinding } from "../doctor-check.js";

const featureFolderPattern = /^F-\d{3,}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/**
 * Content-completeness check.
 *
 * Flags feature PRDs and module memory whose required sections are still unedited template stubs, so
 * generated scaffolds become an enforced workflow rather than silent empty docs. Findings are
 * warnings: they surface gaps without hard-failing structurally healthy repositories.
 */
export async function checkContent(context: DoctorCheckContext): Promise<DoctorFinding[]> {
  if (context.config === undefined) {
    return [];
  }

  const findings: DoctorFinding[] = [];
  const entries = await readDirIfExists(context.rootDir, context.config.featuresDir);
  const featureFolders = entries.filter(
    (entry) => entry.isDirectory() && featureFolderPattern.test(entry.name),
  );

  for (const folder of featureFolders) {
    const prdPath = path.posix.join(context.config.featuresDir, folder.name, "PRD.md");
    const prd = await readFileIfExists(context.rootDir, prdPath);

    if (prd === undefined) {
      continue;
    }

    if (sectionIsUnfilled(prd, "Purpose")) {
      findings.push({
        severity: "warning",
        check: "content-feature-prd",
        message: "Feature PRD purpose is still an unfilled template.",
        path: prdPath,
      });
    }

    if (sectionIsUnfilled(prd, "In Scope")) {
      findings.push({
        severity: "warning",
        check: "content-feature-prd",
        message: "Feature PRD in-scope section is still an unfilled template.",
        path: prdPath,
      });
    }
  }

  const moduleEntries = await readDirIfExists(context.rootDir, context.config.modulesDir);
  const moduleFolders = moduleEntries.filter((entry) => entry.isDirectory());

  for (const folder of moduleFolders) {
    const modulePath = path.posix.join(context.config.modulesDir, folder.name, "MODULE.md");
    const moduleDoc = await readFileIfExists(context.rootDir, modulePath);

    if (moduleDoc === undefined) {
      continue;
    }

    if (sectionIsUnfilled(moduleDoc, "Purpose")) {
      findings.push({
        severity: "warning",
        check: "content-module",
        message: "Module memory purpose is still an unfilled template.",
        path: modulePath,
      });
    }

    if (sectionIsUnfilled(moduleDoc, "Owns")) {
      findings.push({
        severity: "warning",
        check: "content-module",
        message: "Module memory owns section is still an unfilled template.",
        path: modulePath,
      });
    }
  }

  return findings;
}

function sectionIsUnfilled(content: string, heading: string): boolean {
  const section = getSection(content, heading);
  return section !== undefined && isUnfilled(section);
}

function isUnfilled(value: string): boolean {
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
    normalized === "none" ||
    normalized === "n/a"
  ) {
    return true;
  }

  return (
    normalized.includes("describe why this feature exists") ||
    normalized.includes("describe what this module owns")
  );
}

function getSection(content: string, heading: string): string | undefined {
  const lines = content.split(/\r?\n/u);
  const normalizedHeading = `## ${heading.toLowerCase()}`;
  const startIndex = lines.findIndex((line) => line.trim().toLowerCase() === normalizedHeading);

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
