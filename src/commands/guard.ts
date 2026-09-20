import { execFile } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { isTestFile } from "../core/naming/test-files.js";

const execFileAsync = promisify(execFile);

export const GUARD_AUTO_DETECT_CANDIDATES = ["src", "app", "lib"] as const;

export type GuardOptions = {
  rootDir: string;
  source?: string[];
  base?: string;
};

export type GuardStatus = "ok" | "violation" | "skipped";

export type GuardResult = {
  status: GuardStatus;
  exitCode: number;
  sourceFiles: string[];
  testChanged: boolean;
  reason?: string;
  sources: string[];
  autoDetected: boolean;
};

/**
 * Deterministic, read-only "tests came with the change" guard. It inspects the staged diff (or a diff
 * against `base`) and fails when files under the source directories changed without any test change.
 * When `--source` is omitted, conventional source directories (src, app, lib, packages per-package
 * src) are auto-detected; when none exist the guard skips loudly instead of silently passing. It skips
 * gracefully outside a git repository — so adding it to a gate is always safe.
 */
export async function runGuard(options: GuardOptions): Promise<GuardResult> {
  const explicitDirs = (options.source ?? [])
    .map((dir) => dir.replace(/\/+$/u, ""))
    .filter(Boolean);

  let sourceDirs = explicitDirs;
  let autoDetected = false;

  if (sourceDirs.length === 0) {
    sourceDirs = await detectSourceDirs(options.rootDir);
    autoDetected = true;

    if (sourceDirs.length === 0) {
      return {
        status: "skipped",
        exitCode: 0,
        sourceFiles: [],
        testChanged: false,
        reason:
          "no --source directories given and no conventional source directories (src, app, lib, packages/*/src) were found, so there is nothing to guard — pass --source to enforce the gate",
        sources: [],
        autoDetected: true,
      };
    }
  }

  const changed = await changedFiles(options.rootDir, options.base);
  if (changed === null) {
    return {
      status: "skipped",
      exitCode: 0,
      sourceFiles: [],
      testChanged: false,
      reason: "not a git repository (or git is unavailable)",
      sources: sourceDirs,
      autoDetected,
    };
  }

  const underSource = (file: string): boolean =>
    sourceDirs.some((dir) => file === dir || file.startsWith(`${dir}/`));

  const sourceFiles = changed.filter((file) => underSource(file) && !isTestFile(file));
  const testChanged = changed.some((file) => isTestFile(file));

  if (sourceFiles.length > 0 && !testChanged) {
    return {
      status: "violation",
      exitCode: 1,
      sourceFiles,
      testChanged: false,
      sources: sourceDirs,
      autoDetected,
    };
  }

  return { status: "ok", exitCode: 0, sourceFiles, testChanged, sources: sourceDirs, autoDetected };
}

export async function detectSourceDirs(rootDir: string): Promise<string[]> {
  const found: string[] = [];

  for (const candidate of GUARD_AUTO_DETECT_CANDIDATES) {
    if (await isDirectory(rootDir, candidate)) {
      found.push(candidate);
    }
  }

  for (const packageSrc of await detectPackageSources(rootDir)) {
    if (!found.includes(packageSrc)) {
      found.push(packageSrc);
    }
  }

  return found.sort((left, right) => left.localeCompare(right));
}

async function detectPackageSources(rootDir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(path.join(rootDir, "packages"), { withFileTypes: true });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const sources: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const candidate = `packages/${entry.name}/src`;
    if (await isDirectory(rootDir, candidate)) {
      sources.push(candidate);
    }
  }

  return sources;
}

async function isDirectory(rootDir: string, relativePath: string): Promise<boolean> {
  try {
    return (await stat(path.join(rootDir, relativePath))).isDirectory();
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function changedFiles(rootDir: string, base: string | undefined): Promise<string[] | null> {
  const args = base ? ["diff", "--name-only", base] : ["diff", "--cached", "--name-only"];

  try {
    const { stdout } = await execFileAsync("git", args, { cwd: rootDir });
    return stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } catch {
    return null;
  }
}

export function formatGuardResult(result: GuardResult): string {
  if (result.status === "skipped") {
    return `Persist OS guard skipped: ${result.reason}.\n`;
  }

  if (result.status === "ok") {
    if (result.autoDetected) {
      return `Persist OS guard passed: changed source is accompanied by test changes (auto-detected sources: ${result.sources.join(", ")}).\n`;
    }
    return "Persist OS guard passed: changed source is accompanied by test changes.\n";
  }

  const lines = [
    "Persist OS guard failed: source changed without any accompanying test changes.",
    "",
    ...(result.autoDetected
      ? [`Sources checked (auto-detected): ${result.sources.join(", ")}`, ""]
      : []),
    "Source files changed with no test changes:",
    ...result.sourceFiles.map((file) => `- ${file}`),
    "",
    "Add or update a test for this change, or bypass intentionally (for example, git commit --no-verify).",
  ];

  return `${lines.join("\n")}\n`;
}
