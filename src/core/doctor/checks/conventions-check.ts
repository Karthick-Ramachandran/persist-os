import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import type { DoctorCheckContext, DoctorFinding } from "../doctor-check.js";

const CONVENTIONS_PATH = "docs/60-engineering/CONVENTIONS.md";

const featureFolderPattern = /^F-\d{3,}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const acceptedAdrPattern = /^ADR-\d{4,}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u;

/**
 * Conventions-completeness check.
 *
 * Warns when `docs/60-engineering/CONVENTIONS.md` (the repository's canonical, reusable vocabulary)
 * is still an unfilled template, but only once the repository has real work — a bare `persist init`
 * stays green. The named vocabulary is what lets an agent reuse existing primitives instead of
 * inventing new ones; this check makes the scaffold an enforced nudge rather than a silent empty doc.
 *
 * The gate stays structural: it only confirms the doc was filled. Whether a change actually reused
 * the vocabulary is semantic work for the `conventions-adherence` skill, not this check.
 */
export async function checkConventions(context: DoctorCheckContext): Promise<DoctorFinding[]> {
  if (context.config === undefined) {
    return [];
  }

  const conventions = await readFileIfExists(context.rootDir, CONVENTIONS_PATH);
  if (conventions === undefined) {
    return [];
  }

  if (!(await repositoryHasWork(context))) {
    return [];
  }

  if (sectionIsUnfilled(conventions, "Canonical Primitives")) {
    return [
      {
        severity: "warning",
        check: "content-conventions",
        message: "Conventions canonical-primitives section is still an unfilled template.",
        path: CONVENTIONS_PATH,
      },
    ];
  }

  return [];
}

async function repositoryHasWork(context: DoctorCheckContext): Promise<boolean> {
  if (context.config === undefined) {
    return false;
  }

  const features = (await readDirIfExists(context.rootDir, context.config.featuresDir)).filter(
    (entry) => entry.isDirectory() && featureFolderPattern.test(entry.name),
  );
  if (features.length > 0) {
    return true;
  }

  const modules = (await readDirIfExists(context.rootDir, context.config.modulesDir)).filter(
    (entry) => entry.isDirectory(),
  );
  if (modules.length > 0) {
    return true;
  }

  const adrs = (await readDirIfExists(context.rootDir, context.config.adrDir)).filter(
    (entry) => entry.isFile() && acceptedAdrPattern.test(entry.name),
  );
  return adrs.length > 0;
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

  return normalized.includes("describe the named building blocks");
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
