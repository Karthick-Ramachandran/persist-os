import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { FENCES_FILE } from "../../fence/generate-fence.js";
import type { DoctorCheckContext, DoctorCheckOutcome, DoctorFinding } from "../doctor-check.js";
import { requiredDocs } from "./required-files-check.js";

const adrFilePattern = /^ADR-(\d{4,})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/iu;
const adrReferencePattern = /ADR-\d{4,}/giu;

export type SupersededCheckResult = {
  findings: DoctorFinding[];
  outcome: DoctorCheckOutcome;
};

/**
 * Deterministic, local, read-only superseded-reference check.
 *
 * When a decision changes, `persist adr supersede` marks the old ADR "Accepted — superseded by …" and
 * records a new accepted ADR. This check flags current-state memory that still cites the
 * superseded ADR as authority, so the reasoning trail gets updated instead of silently going stale.
 * It only fires when a superseded ADR exists and is still referenced — a repository with none stays
 * green. Semantic agreement between docs is left to the agent; this only follows the explicit
 * supersede trail.
 *
 * Scanned: the required default docs, FENCES.md, and in-progress feature and module memory —
 * the current-state set the code-reference check reads. Not scanned: the ADR directory itself
 * (the new ADR legitimately links back to the one it supersedes, and the old one's status
 * section names its replacement — flagging either would punish the trail), the ADR index
 * (a catalog, not authority), and the agent entry files (routing, not reasoning).
 */
export async function checkSuperseded(context: DoctorCheckContext): Promise<SupersededCheckResult> {
  if (context.config === undefined) {
    return notEvaluated("no validated Persist OS config, so the memory to scan is unknown");
  }

  const supersededIds = await loadSupersededAdrIds(context.rootDir, context.config.adrDir);

  // Bound after the guard: narrowing does not reach into the closures below.
  const config = context.config;
  const findings: DoctorFinding[] = [];
  let scanned = 0;

  for (const referenceDir of [config.featuresDir, config.modulesDir]) {
    const result = await checkReferences(context.rootDir, referenceDir, supersededIds);
    findings.push(...result.findings);
    scanned += result.scanned;
  }

  const defaultFiles = [
    ...requiredDocs.map((doc) => path.posix.join(config.docsDir, doc)),
    path.posix.join(config.docsDir, FENCES_FILE),
  ];
  for (const file of defaultFiles) {
    const content = await readFileIfExists(context.rootDir, file);
    if (content === undefined) {
      continue;
    }
    scanned += 1;
    for (const id of findSupersededReferences(content, supersededIds)) {
      findings.push({
        severity: "warning",
        check: "superseded-reference",
        message: `Repository memory references ${id}, which has been superseded — update it to the current decision.`,
        path: file,
      });
    }
  }

  if (scanned === 0) {
    return notEvaluated(
      "no feature, module, or default memory files exist, so there is nothing to scan for superseded references",
    );
  }

  return { findings, outcome: { id: "superseded", status: "evaluated" } };
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

/**
 * A feature folder containing a completion report is history. Its docs cite the decision that was
 * accepted when the work was done, and that citation stays correct after the decision is later
 * superseded — the same rule code-reference and staleness already apply.
 */
async function isCompletedFeature(rootDir: string, featureDir: string): Promise<boolean> {
  try {
    await readFile(path.join(rootDir, featureDir, "COMPLETION_REPORT.md"), "utf8");
    return true;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function checkReferences(
  rootDir: string,
  referenceDir: string,
  supersededIds: Set<string>,
): Promise<{ findings: DoctorFinding[]; scanned: number }> {
  const findings: DoctorFinding[] = [];
  let scanned = 0;
  const files = await readMarkdownFiles(rootDir, referenceDir);
  const completed = new Map<string, boolean>();

  for (const file of files) {
    const folder = path.posix.dirname(file);
    if (folder !== referenceDir) {
      let isHistory = completed.get(folder);
      if (isHistory === undefined) {
        isHistory = await isCompletedFeature(rootDir, folder);
        completed.set(folder, isHistory);
      }
      if (isHistory) {
        continue;
      }
    }

    const content = await readFile(path.join(rootDir, file), "utf8");
    scanned += 1;

    for (const id of findSupersededReferences(content, supersededIds)) {
      findings.push({
        severity: "warning",
        check: "superseded-reference",
        message: `Repository memory references ${id}, which has been superseded — update it to the current decision.`,
        path: file,
      });
    }
  }

  return { findings, scanned };
}

/** ADR identifiers outside fenced code blocks and inline code (illustrative examples). */
function findSupersededReferences(content: string, supersededIds: Set<string>): string[] {
  const referenced = new Set<string>();
  for (const match of stripCode(content).matchAll(adrReferencePattern)) {
    referenced.add(match[0].toUpperCase());
  }
  return [...referenced].filter((id) => supersededIds.has(id));
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

function notEvaluated(reason: string): SupersededCheckResult {
  return {
    findings: [],
    outcome: { id: "superseded", status: "not-evaluated", reason },
  };
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
