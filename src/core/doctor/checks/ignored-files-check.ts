import { execFile } from "node:child_process";
import { lstat, readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { CONTEXT_DIR_NAME } from "../../context/context-card.js";
import {
  CLAUDE_SETTINGS_PATH,
  CODEX_CONTEXT_HOOK_PATH,
  CODEX_HOOKS_JSON_PATH,
  CONTEXT_PROMPT_HOOK_PATH,
  SESSION_START_HOOK_PATH,
} from "../../hooks/generate-hook.js";
import type { DoctorCheckContext, DoctorCheckOutcome, DoctorFinding } from "../doctor-check.js";
import { advisoryToolFiles, requiredDocs, requiredRootFiles } from "./required-files-check.js";
import { isGitRepository } from "./staleness-check.js";

const execFileAsync = promisify(execFile);

export type IgnoredFilesCheckResult = {
  findings: DoctorFinding[];
  outcome: DoctorCheckOutcome;
};

/**
 * Deterministic, local, read-only sharing check. Repository memory only works when the team
 * receives it: a `.gitignore` that excludes `CLAUDE.md` or `.claude/` leaves the memory on one
 * machine while everyone else starts with nothing — and nothing said so. This warns for every
 * memory file that exists but git would not share.
 *
 * Only present files are reported: a missing file is the required-files check's error, not
 * this warning. Outside a git repository there are no ignore rules to read, so the check
 * reports not-evaluated instead of passing.
 */
export async function checkIgnoredFiles(
  context: DoctorCheckContext,
): Promise<IgnoredFilesCheckResult> {
  if (context.config === undefined) {
    return notEvaluated("no validated Persist OS config, so the memory files to check are unknown");
  }
  if (!(await isGitRepository(context.rootDir))) {
    return notEvaluated("not a git repository, so ignore rules cannot be evaluated");
  }

  // Bound after the guard: narrowing does not reach into the closures below.
  const config = context.config;
  const candidates = [
    ...requiredRootFiles(config.aiTools),
    ...advisoryToolFiles(config.aiTools),
    ...requiredDocs.map((doc) => path.posix.join(config.docsDir, doc)),
    ...(await listContextCards(context.rootDir, config.docsDir)),
    path.posix.join(config.adrDir, "README.md"),
    SESSION_START_HOOK_PATH,
    CLAUDE_SETTINGS_PATH,
    CONTEXT_PROMPT_HOOK_PATH,
    CODEX_CONTEXT_HOOK_PATH,
    CODEX_HOOKS_JSON_PATH,
  ];

  const existing: string[] = [];
  for (const candidate of candidates) {
    if (await isFile(context.rootDir, candidate)) {
      existing.push(candidate);
    }
  }

  const ignored = await ignoredByGit(context.rootDir, existing);

  return {
    findings: ignored.map((file) => ({
      severity: "warning" as const,
      check: "git-ignored",
      message:
        `\`${file}\` is ignored by git and will not be shared with the team. Un-ignore it, ` +
        `or accept that only this checkout loads that memory.`,
      path: file,
    })),
    outcome: { id: "ignored-files", status: "evaluated" },
  };
}

function notEvaluated(reason: string): IgnoredFilesCheckResult {
  return {
    findings: [],
    outcome: { id: "ignored-files", status: "not-evaluated", reason },
  };
}

/**
 * The ignored subset of known-present paths. `check-ignore` exits 1 when nothing matches, so
 * exit 1 with no output is the quiet path, not an error; anything else without output is.
 */
async function ignoredByGit(rootDir: string, relativePaths: string[]): Promise<string[]> {
  if (relativePaths.length === 0) {
    return [];
  }

  // Paths ride on argv, not stdin: promisified execFile with piped input does not reliably
  // close the child's stdin on this runtime, which hangs the check. The candidate list is
  // small (the memory files), so argv length is never a concern.
  try {
    const { stdout } = await execFileAsync("git", ["check-ignore", "--", ...relativePaths], {
      cwd: rootDir,
    });
    return splitPaths(stdout);
  } catch (error) {
    const execError = error as { code?: unknown; stdout?: unknown };
    if (execError.code === 1 && typeof execError.stdout === "string") {
      return splitPaths(execError.stdout);
    }
    throw error;
  }
}

function splitPaths(stdout: string): string[] {
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

/** Every context card file, so a git-ignored card warns like any other memory. */
async function listContextCards(rootDir: string, docsDir: string): Promise<string[]> {
  const dir = path.posix.join(docsDir, CONTEXT_DIR_NAME);
  try {
    return (await readdir(path.join(rootDir, dir), { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => path.posix.join(dir, entry.name));
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
