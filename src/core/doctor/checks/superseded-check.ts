import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import type { DoctorCheckContext, DoctorFinding } from "../doctor-check.js";

const adrFilePattern = /^ADR-(\d{4,})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/iu;
const adrReferencePattern = /ADR-\d{4,}/giu;

/**
 * Deterministic, local, read-only superseded-reference check.
 *
 * When a decision changes, `recall adr supersede` marks the old ADR "Accepted — superseded by …" and
 * records a new accepted ADR. This check flags feature or module memory that still cites the
 * superseded ADR as authority, so the reasoning trail gets updated instead of silently going stale.
 * It only fires when a superseded ADR exists and is still referenced — a repository with none stays
 * green. Semantic agreement between docs is left to the agent; this only follows the explicit
 * supersede trail.
 */
export async function checkSuperseded(context: DoctorCheckContext): Promise<DoctorFinding[]> {
  if (context.config === undefined) {
    return [];
  }

  const supersededIds = await loadSupersededAdrIds(context.rootDir, context.config.adrDir);
  if (supersededIds.size === 0) {
    return [];
  }

  const findings: DoctorFinding[] = [];
  findings.push(
    ...(await checkReferences(context.rootDir, context.config.featuresDir, supersededIds)),
  );
  findings.push(
    ...(await checkReferences(context.rootDir, context.config.modulesDir, supersededIds)),
  );

  return findings;
}

async function loadSupersededAdrIds(rootDir: string, adrDir: string): Promise<Set<string>> {
  const superseded = new Set<string>();
  const files = await readMarkdownFiles(rootDir, adrDir);

  for (const file of files) {
    const match = adrFilePattern.exec(path.basename(file));
    if (match === null) {
      continue;
    }

    const content = await readFile(path.join(rootDir, file), "utf8");
    if (statusContains(content, /superseded\s+by/iu)) {
      superseded.add(`ADR-${match[1]}`.toUpperCase());
    }
  }

  return superseded;
}

async function checkReferences(
  rootDir: string,
  referenceDir: string,
  supersededIds: Set<string>,
): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  const files = await readMarkdownFiles(rootDir, referenceDir);

  for (const file of files) {
    const content = await readFile(path.join(rootDir, file), "utf8");
    const referenced = new Set<string>();

    // Ignore ADR identifiers inside fenced code blocks and inline code (illustrative examples).
    for (const match of stripCode(content).matchAll(adrReferencePattern)) {
      referenced.add(match[0].toUpperCase());
    }

    for (const id of referenced) {
      if (supersededIds.has(id)) {
        findings.push({
          severity: "warning",
          check: "superseded-reference",
          message: `Repository memory references ${id}, which has been superseded — update it to the current decision.`,
          path: file,
        });
      }
    }
  }

  return findings;
}

function statusContains(content: string, pattern: RegExp): boolean {
  const lines = content.split(/\r?\n/u);
  const startIndex = lines.findIndex((line) => line.trim().toLowerCase() === "## status");
  if (startIndex === -1) {
    return false;
  }

  const body: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (/^##\s+/u.test(lines[index])) {
      break;
    }
    body.push(lines[index]);
  }

  return pattern.test(body.join("\n"));
}

function stripCode(content: string): string {
  return content
    .replace(/```[\s\S]*?```/gu, " ")
    .replace(/~~~[\s\S]*?~~~/gu, " ")
    .replace(/`[^`]*`/gu, " ");
}

async function readMarkdownFiles(rootDir: string, relativeDir: string): Promise<string[]> {
  const entries = await readDirIfExists(rootDir, relativeDir);
  const files: string[] = [];

  for (const entry of entries) {
    const childRelative = path.posix.join(relativeDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await readMarkdownFiles(rootDir, childRelative)));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(childRelative);
    }
  }

  return files;
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
