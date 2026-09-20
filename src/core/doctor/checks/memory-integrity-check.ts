import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { REQUIRED_ADR_SECTIONS } from "../../adr/adr-sections.js";
import type { DoctorCheckContext, DoctorCheckOutcome, DoctorFinding } from "../doctor-check.js";
import { requiredDocs } from "./required-files-check.js";

const featureFolderPattern = /^F-\d{3,}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const adrFilePattern = /^ADR-\d{4,}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u;

const requiredModuleDocs = ["MODULE.md", "TASKS.md", "TEST_PLAN.md", "DECISIONS.md"];

const requiredAdrSections = REQUIRED_ADR_SECTIONS;

const markdownLinkPattern = /\[[^\]]*\]\(([^)\s]+)\)/gu;
const backtickDocPattern = /`(docs\/[A-Za-z0-9._/-]+\.md)`/gu;
const adrIdPattern = /ADR-\d{4,}/giu;
const placeholderMarkers = /[<>*]|\.\.\./u;

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
  const requiredDocPaths = await listRequiredDocs(rootDir, config.docsDir);

  if (
    featureFolders.length === 0 &&
    moduleFolders.length === 0 &&
    adrFiles.length === 0 &&
    requiredDocPaths.length === 0
  ) {
    return notEvaluated(
      "no feature folders, module folders, ADRs, or required documents exist, so there is no memory to validate",
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
  findings.push(
    ...(await checkRequiredDocReferences(rootDir, config.adrDir, requiredDocPaths, adrFiles)),
  );

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

async function listRequiredDocs(rootDir: string, docsDir: string): Promise<string[]> {
  const existing: string[] = [];

  for (const doc of requiredDocs) {
    const filePath = path.posix.join(docsDir, doc);
    if (await isFile(rootDir, filePath)) {
      existing.push(filePath);
    }
  }

  return existing;
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

/**
 * Cross-references between the memory that survives: doc-path links inside the six required
 * documents must resolve, and ADR identifiers they cite must match a known ADR. Missing
 * targets are errors (the memory references something that does not exist); references to
 * not-yet-accepted ADRs are warnings. Mirrors the drift check's severities for the feature
 * and module memory it does not cover.
 */
async function checkRequiredDocReferences(
  rootDir: string,
  adrDir: string,
  requiredDocPaths: string[],
  adrFiles: string[],
): Promise<DoctorFinding[]> {
  const knownAdrs = await loadKnownAdrs(rootDir, adrDir, adrFiles);
  const findings: DoctorFinding[] = [];

  for (const docPath of requiredDocPaths) {
    const content = await readFile(path.join(rootDir, docPath), "utf8");
    const checkedTargets = new Set<string>();

    for (const target of extractDocTargets(content)) {
      const resolved = resolveDocTarget(docPath, target);
      if (resolved === undefined || checkedTargets.has(resolved)) {
        continue;
      }
      checkedTargets.add(resolved);

      if (!(await isFile(rootDir, resolved))) {
        findings.push({
          severity: "error",
          check: "memory-doc-reference",
          message: `Required memory references ${target}, which does not exist.`,
          path: docPath,
        });
      }
    }

    for (const id of extractAdrIds(content)) {
      const known = knownAdrs.get(id);

      if (known === undefined) {
        findings.push({
          severity: "error",
          check: "memory-adr-reference",
          message: `Required memory references ${id} but no matching ADR exists.`,
          path: docPath,
        });
        continue;
      }

      if (!known.accepted) {
        findings.push({
          severity: "warning",
          check: "memory-proposed-reference",
          message: `Required memory references ${id} which is not accepted.`,
          path: docPath,
        });
      }
    }
  }

  return findings;
}

function extractDocTargets(content: string): string[] {
  const targets: string[] = [];

  for (const match of content.matchAll(markdownLinkPattern)) {
    const target = match[1].split("#")[0];
    if (target.length === 0 || /^(https?|mailto):/u.test(target)) {
      continue;
    }
    if (
      (target.startsWith("docs/") || target.endsWith(".md")) &&
      !placeholderMarkers.test(target)
    ) {
      targets.push(target);
    }
  }

  for (const match of content.matchAll(backtickDocPattern)) {
    if (!placeholderMarkers.test(match[1])) {
      targets.push(match[1]);
    }
  }

  return targets;
}

/**
 * ADR identifiers outside code spans, so illustrative examples are not treated as real
 * references — the same code-stripping the drift check applies to feature memory.
 */
function extractAdrIds(content: string): string[] {
  const stripped = content
    .replace(/```[\s\S]*?```/gu, " ")
    .replace(/~~~[\s\S]*?~~~/gu, " ")
    .replace(/`[^`]*`/gu, " ");
  const ids = new Set<string>();

  for (const match of stripped.matchAll(adrIdPattern)) {
    ids.add(match[0].toUpperCase());
  }

  return [...ids];
}

function resolveDocTarget(docPath: string, target: string): string | undefined {
  if (target.includes("\0")) {
    return undefined;
  }

  if (target.startsWith("docs/")) {
    return path.posix.normalize(target);
  }

  return path.posix.normalize(path.posix.join(path.posix.dirname(docPath), target));
}

async function loadKnownAdrs(
  rootDir: string,
  adrDir: string,
  adrFiles: string[],
): Promise<Map<string, { accepted: boolean }>> {
  const known = new Map<string, { accepted: boolean }>();

  for (const adrFile of adrFiles) {
    const match = /^ADR-(\d{4,})-/u.exec(adrFile);
    if (match === null) {
      continue;
    }

    const content = await readFile(path.join(rootDir, adrDir, adrFile), "utf8");
    known.set(`ADR-${match[1]}`, {
      accepted: sectionContains(content, "Status", /\baccepted\b/iu),
    });
  }

  return known;
}

function sectionContains(content: string, heading: string, pattern: RegExp): boolean {
  const section = getSection(content, heading);
  return section !== undefined && pattern.test(section);
}

function getSection(content: string, heading: string): string | undefined {
  const lines = content.split(/\r?\n/u);
  const startIndex = lines.findIndex(
    (line) => line.trim().toLowerCase() === `## ${heading.toLowerCase()}`,
  );

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
