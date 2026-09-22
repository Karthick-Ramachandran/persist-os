import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { matchesPattern } from "../../adr/governing-adrs.js";
import { countLessonBullets, parseLessons } from "../../lessons/lessons.js";
import type { DoctorCheckContext, DoctorCheckOutcome, DoctorFinding } from "../doctor-check.js";

const execFileAsync = promisify(execFile);

const featureFolderPattern = /^F-\d{3,}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const acceptedAdrPattern = /^ADR-\d{4,}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u;

const SECURITY_MODEL_PATH = "docs/20-security/SECURITY_MODEL.md";
const THREAT_MODEL_PATH = "docs/20-security/THREAT_MODEL.md";
const PRODUCT_DOC = "00-product/PRODUCT.md";

/**
 * Content-completeness check.
 *
 * Flags feature PRDs and module memory whose required sections are still unedited template stubs, so
 * generated scaffolds become an enforced workflow rather than silent empty docs. Findings are
 * warnings: they surface gaps without hard-failing structurally healthy repositories.
 */
export type ContentCheckResult = {
  findings: DoctorFinding[];
  outcome: DoctorCheckOutcome;
};

export async function checkContent(context: DoctorCheckContext): Promise<ContentCheckResult> {
  if (context.config === undefined) {
    return notEvaluated("Content checks require Persist OS config.");
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

  const adrEntries = await readDirIfExists(context.rootDir, context.config.adrDir);
  const acceptedAdrs = adrEntries.filter(
    (entry) => entry.isFile() && acceptedAdrPattern.test(entry.name),
  );

  // Force the foundational security docs to be filled, but only once the repository has real work.
  // A bare `persist init` stays green; a project with a feature, module, or accepted decision must
  // not leave its threat model and security model as untouched stubs.
  const hasWork = featureFolders.length > 0 || moduleFolders.length > 0 || acceptedAdrs.length > 0;

  // Lessons upkeep does not wait for real work: a LESSONS.md in a repo with
  // no features, modules, or ADRs still gets its grouping nudge. A missing
  // file reports nothing, so a bare `persist init` stays not-evaluated.
  const lessonsFindings = await checkLessonsDoc(context.rootDir, context.config.docsDir);

  if (!hasWork && lessonsFindings.length === 0) {
    return notEvaluated(
      "no feature folders, module folders, or ADRs exist, so there is no memory content to check",
    );
  }

  // Security, product, and module templates are only forced once the
  // repository has real work; the lessons nudge above rides regardless.
  if (hasWork) {
    findings.push(...(await checkSecurityDoc(context.rootDir)));
    findings.push(...(await checkProductDoc(context.rootDir, context.config.docsDir)));
  }

  // A bare `persist init` stays green (its template is quiet under every
  // lessons finding), and a repository with real work gets its Always size
  // and dead scopes measured.
  findings.push(...lessonsFindings);

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

  return { findings, outcome: { id: "content", status: "evaluated" } };
}

function notEvaluated(reason: string): ContentCheckResult {
  return {
    findings: [],
    outcome: { id: "content", status: "not-evaluated", reason },
  };
}

async function checkSecurityDoc(rootDir: string): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];

  const security = await readFileIfExists(rootDir, SECURITY_MODEL_PATH);
  if (security !== undefined && sectionIsUnfilled(security, "Authentication And Authorization")) {
    findings.push({
      severity: "warning",
      check: "content-security",
      message:
        "Security model authentication and authorization section is still an unfilled template.",
      path: SECURITY_MODEL_PATH,
    });
  }

  const threat = await readFileIfExists(rootDir, THREAT_MODEL_PATH);
  if (threat !== undefined && sectionIsUnfilled(threat, "Assets")) {
    findings.push({
      severity: "warning",
      check: "content-threat-model",
      message: "Threat model assets section is still an unfilled template.",
      path: THREAT_MODEL_PATH,
    });
  }

  return findings;
}

/**
 * The required product file, once the repository has work. CONVENTIONS.md is deliberately not
 * repeated here: the conventions check already owns its template detection, and one gap should
 * produce one warning, not two.
 */
async function checkProductDoc(rootDir: string, docsDir: string): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  const productPath = path.posix.join(docsDir, PRODUCT_DOC);
  const product = await readFileIfExists(rootDir, productPath);

  if (product === undefined) {
    return findings;
  }

  if (sectionIsUnfilled(product, "Purpose")) {
    findings.push({
      severity: "warning",
      check: "content-product",
      message: "Product purpose is still an unfilled template.",
      path: productPath,
    });
  }

  if (sectionIsUnfilled(product, "Users")) {
    findings.push({
      severity: "warning",
      check: "content-product",
      message: "Product users section is still an unfilled template.",
      path: productPath,
    });
  }

  return findings;
}

const LESSONS_DOC = "60-engineering/LESSONS.md";

/** Always is for the few lessons every task needs: at most 12 bullets or about 1.5 KB. */
const ALWAYS_BULLET_LIMIT = 12;
const ALWAYS_BYTE_LIMIT = 1536;
/** Past this size, group lessons by area so agents are only handed the relevant ones. */
const GROUP_BULLET_LIMIT = 20;
/** Past this size, the whole file is a wall of text no lookup can aim. */
const LESSONS_BYTE_LIMIT = 12 * 1024;

/**
 * Lessons-shape check. A missing LESSONS.md is fine (required-files owns
 * presence); a present one is measured: Always stays small because it loads
 * into every session, big flat files get grouped into areas, and an Applies
 * To list that covers no file in the repository is a dead scope.
 */
async function checkLessonsDoc(rootDir: string, docsDir: string): Promise<DoctorFinding[]> {
  const lessonsPath = path.posix.join(docsDir, LESSONS_DOC);
  const content = await readFileIfExists(rootDir, lessonsPath);
  if (content === undefined) {
    return [];
  }

  const findings: DoctorFinding[] = [];
  const lessons = parseLessons(content);

  if (
    lessons.always.length > ALWAYS_BULLET_LIMIT ||
    Buffer.byteLength(lessons.always.join("\n"), "utf8") > ALWAYS_BYTE_LIMIT
  ) {
    findings.push({
      severity: "warning",
      check: "content-lessons",
      message:
        `The Always section holds ${lessons.always.length} lessons — Always is for the few ` +
        `lessons every task needs; move the rest into areas.`,
      path: lessonsPath,
    });
  }

  if (!lessons.isSectioned && countLessonBullets(lessons) > GROUP_BULLET_LIMIT) {
    findings.push({
      severity: "info",
      check: "content-lessons",
      message:
        `LESSONS.md holds ${countLessonBullets(lessons)} lessons with no area sections — ` +
        `group lessons by area so agents are only handed the relevant ones.`,
      path: lessonsPath,
    });
  }

  if (Buffer.byteLength(content, "utf8") > LESSONS_BYTE_LIMIT) {
    findings.push({
      severity: "warning",
      check: "content-lessons",
      message:
        `LESSONS.md exceeds about 12 KB — split it into areas with Applies To lists so ` +
        `lookups hand over only the relevant sections.`,
      path: lessonsPath,
    });
  }

  const scoped = lessons.areas.filter(
    (area) => area.appliesTo.length > 0 && hasRealLessons(area.bullets),
  );
  const tracked = scoped.length === 0 ? undefined : await listTrackedFiles(rootDir);
  for (const area of scoped) {
    if (tracked === undefined) {
      break;
    }
    const covers = area.appliesTo.some((pattern) =>
      tracked.some((file) => matchesPattern(pattern, file)),
    );
    if (!covers) {
      findings.push({
        severity: "warning",
        check: "content-lessons",
        message:
          `Lesson area "${area.title}" applies to ${area.appliesTo.join(", ")}, which matches ` +
          `no file in the repository — fix the patterns or remove the area.`,
        path: lessonsPath,
      });
    }
  }

  return findings;
}

/**
 * Template scaffolding is not a dead scope: an area whose every bullet is
 * still an `(example)` placeholder has no claims about the repository yet.
 */
function hasRealLessons(bullets: string[]): boolean {
  return bullets.some((bullet) => !/^\(example\)/iu.test(bullet.trim()));
}

/** Repo files from `git ls-files`. Outside git there is no scope to measure — never an error. */
async function listTrackedFiles(rootDir: string): Promise<string[] | undefined> {
  try {
    const { stdout } = await execFileAsync("git", ["ls-files"], { cwd: rootDir });
    return stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");
  } catch {
    return undefined;
  }
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
    normalized.includes("describe what this module owns") ||
    normalized.includes("describe how this repository authenticates") ||
    normalized.includes("describe what this repository must protect") ||
    normalized.includes("describe what this repository is building and why") ||
    normalized.includes("describe who this is for")
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
