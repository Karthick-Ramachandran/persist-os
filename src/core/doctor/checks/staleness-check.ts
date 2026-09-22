import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { codePathsIn, readCodeRoots } from "../../memory/code-paths.js";
import { promisify } from "node:util";

import type { DoctorCheckContext, DoctorCheckOutcome, DoctorFinding } from "../doctor-check.js";

const execFileAsync = promisify(execFile);

const featureFolderPattern = /^F-\d{3,}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const adrFilePattern = /^ADR-\d{4,}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u;

const CONVENTIONS_DOC = "60-engineering/CONVENTIONS.md";
const COMPLETION_REPORT = "COMPLETION_REPORT.md";

// Planning docs of a feature folder containing a completion report are history, not
// current-state memory: they describe what was built at the time and are skipped, the same
// classification the code-reference check applies.
const FEATURE_DOCS = ["PRD.md", "ARCHITECTURE_IMPACT.md"];
const MODULE_DOCS = ["MODULE.md", "DECISIONS.md"];

// Conservative gap: only flag when the referenced code's last commit is this much newer than the
// memory's last commit. A fresh repo commits docs and code together (no gap), so this stays quiet;
// it fires when memory is genuinely old and the code it cites moved on long after.
// Exported: the context-cards check reuses this threshold and the git plumbing below rather than
// inventing its own, so every staleness verdict in doctor means the same gap.
export const STALE_AFTER_SECONDS = 90 * 24 * 60 * 60;

export type StalenessCheckResult = {
  findings: DoctorFinding[];
  outcome: DoctorCheckOutcome;
};

/**
 * Deterministic, read-only staleness heuristic. For current-state memory (ADRs, conventions,
 * and in-progress feature and module docs) that cites an existing `src/`/`tests/` file, it
 * compares the memory's last git commit to the file's last commit; if the code changed far
 * more recently, the memory may have drifted. It only runs inside a git repository with full
 * history — outside git, or in a shallow clone where every file reports the same commit time,
 * it reports not-evaluated with the reason instead of an empty pass. It is a heuristic nudge
 * (warning) — confirming a real contradiction is the agent's job, not the gate's.
 */
export async function checkStaleness(context: DoctorCheckContext): Promise<StalenessCheckResult> {
  if (context.config === undefined) {
    return notEvaluated(
      "no validated Persist OS config, so the memory directories to scan are unknown",
    );
  }
  if (!(await isGitRepository(context.rootDir))) {
    return notEvaluated("not a git repository, so commit history is unavailable");
  }
  if (await isShallowRepository(context.rootDir)) {
    return notEvaluated(
      "shallow clone (fetch-depth 1): every file reports the same commit time, so staleness cannot be measured — use fetch-depth: 0",
    );
  }

  const featureEntries = await readDirIfExists(context.rootDir, context.config.featuresDir);
  const hasFeatures = featureEntries.some(
    (folder) => folder.isDirectory() && featureFolderPattern.test(folder.name),
  );
  const moduleEntries = await readDirIfExists(context.rootDir, context.config.modulesDir);
  const hasModules = moduleEntries.some((folder) => folder.isDirectory());
  const adrEntries = await readDirIfExists(context.rootDir, context.config.adrDir);
  const hasAdrs = adrEntries.some((entry) => entry.isFile() && adrFilePattern.test(entry.name));
  const conventions = await readFileIfExists(
    context.rootDir,
    path.posix.join(context.config.docsDir, CONVENTIONS_DOC),
  );

  if (!hasFeatures && !hasModules && !hasAdrs && conventions === undefined) {
    return notEvaluated(
      "no ADRs, conventions, feature folders, or module folders exist, so there is no memory to compare against code history",
    );
  }

  const docPaths = await collectDocPaths(context.rootDir, context.config);
  const commitTimes = new Map<string, number | null>();

  const lastCommit = async (relativePath: string): Promise<number | null> => {
    const cached = commitTimes.get(relativePath);
    if (cached !== undefined) {
      return cached;
    }
    const value = await lastCommitTime(context.rootDir, relativePath);
    commitTimes.set(relativePath, value);
    return value;
  };

  const findings: DoctorFinding[] = [];
  const roots = await readCodeRoots(context.rootDir, context.config.docsDir);

  for (const docPath of docPaths) {
    const content = await readFileIfExists(context.rootDir, docPath);
    if (content === undefined) {
      continue;
    }

    const docTime = await lastCommit(docPath);
    if (docTime === null) {
      continue; // uncommitted memory has no history to compare against
    }

    for (const reference of codePathsIn(content, roots)) {
      if (!existsSync(path.join(context.rootDir, reference))) {
        continue; // a missing reference is the code-reference check's job, not staleness
      }

      const fileTime = await lastCommit(reference);
      if (fileTime !== null && fileTime - docTime > STALE_AFTER_SECONDS) {
        findings.push({
          severity: "warning",
          check: "staleness",
          message: `Repository memory references ${reference}, which changed long after this memory was last updated — review it for staleness.`,
          path: docPath,
        });
      }
    }
  }

  return { findings, outcome: { id: "staleness", status: "evaluated" } };
}

function notEvaluated(reason: string): StalenessCheckResult {
  return {
    findings: [],
    outcome: { id: "staleness", status: "not-evaluated", reason },
  };
}

async function collectDocPaths(
  rootDir: string,
  config: NonNullable<DoctorCheckContext["config"]>,
): Promise<string[]> {
  const paths: string[] = [];

  for (const entry of await readDirIfExists(rootDir, config.adrDir)) {
    if (entry.isFile() && adrFilePattern.test(entry.name)) {
      paths.push(path.posix.join(config.adrDir, entry.name));
    }
  }

  const conventionsPath = path.posix.join(config.docsDir, CONVENTIONS_DOC);
  if ((await readFileIfExists(rootDir, conventionsPath)) !== undefined) {
    paths.push(conventionsPath);
  }

  for (const folder of await readDirIfExists(rootDir, config.featuresDir)) {
    if (folder.isDirectory() && featureFolderPattern.test(folder.name)) {
      const featureDir = path.posix.join(config.featuresDir, folder.name);
      if (await isCompletedFeature(rootDir, featureDir)) {
        continue;
      }
      for (const doc of FEATURE_DOCS) {
        paths.push(path.posix.join(featureDir, doc));
      }
    }
  }

  for (const folder of await readDirIfExists(rootDir, config.modulesDir)) {
    if (folder.isDirectory()) {
      for (const doc of MODULE_DOCS) {
        paths.push(path.posix.join(config.modulesDir, folder.name, doc));
      }
    }
  }

  return paths;
}

async function isCompletedFeature(rootDir: string, featureDir: string): Promise<boolean> {
  return (
    (await readFileIfExists(rootDir, path.posix.join(featureDir, COMPLETION_REPORT))) !== undefined
  );
}

/**
 * Shared with the ignored-files check: git-backed checks report not-evaluated outside a work
 * tree instead of an empty pass, and both need the same definition of "inside git".
 */
export async function isGitRepository(rootDir: string): Promise<boolean> {
  try {
    await execFileAsync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: rootDir });
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect a shallow clone, where every file reports the same single-commit timestamp and the
 * doc-vs-code time comparison can never produce a gap. An old git without the subcommand fails
 * here — treat that as full history rather than crashing, since the comparison degrades to its
 * previous behavior instead of something worse.
 */
export async function isShallowRepository(rootDir: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--is-shallow-repository"], {
      cwd: rootDir,
    });
    return stdout.trim() === "true";
  } catch {
    return false;
  }
}

export async function lastCommitTime(
  rootDir: string,
  relativePath: string,
): Promise<number | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["log", "-1", "--format=%ct", "--", relativePath],
      { cwd: rootDir },
    );
    const trimmed = stdout.trim();
    if (trimmed.length === 0) {
      return null;
    }
    const seconds = Number.parseInt(trimmed, 10);
    return Number.isFinite(seconds) ? seconds : null;
  } catch {
    return null;
  }
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
