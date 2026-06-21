import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { isTestFile } from "../core/naming/test-files.js";

const execFileAsync = promisify(execFile);

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
};

/**
 * Deterministic, read-only "tests came with the change" guard. It inspects the staged diff (or a diff
 * against `base`) and fails when files under the given source directories changed without any test
 * change. It never blocks unless explicitly told what counts as source (`source`), and it skips
 * gracefully outside a git repository — so adding it to a gate is always safe.
 */
export async function runGuard(options: GuardOptions): Promise<GuardResult> {
  const sourceDirs = (options.source ?? []).map((dir) => dir.replace(/\/+$/u, "")).filter(Boolean);

  if (sourceDirs.length === 0) {
    return {
      status: "skipped",
      exitCode: 0,
      sourceFiles: [],
      testChanged: false,
      reason: "no --source directories given, so there is nothing to guard",
    };
  }

  const changed = await changedFiles(options.rootDir, options.base);
  if (changed === null) {
    return {
      status: "skipped",
      exitCode: 0,
      sourceFiles: [],
      testChanged: false,
      reason: "not a git repository (or git is unavailable)",
    };
  }

  const underSource = (file: string): boolean =>
    sourceDirs.some((dir) => file === dir || file.startsWith(`${dir}/`));

  const sourceFiles = changed.filter((file) => underSource(file) && !isTestFile(file));
  const testChanged = changed.some((file) => isTestFile(file));

  if (sourceFiles.length > 0 && !testChanged) {
    return { status: "violation", exitCode: 1, sourceFiles, testChanged: false };
  }

  return { status: "ok", exitCode: 0, sourceFiles, testChanged };
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
    return `Recall OS guard skipped: ${result.reason}.\n`;
  }

  if (result.status === "ok") {
    return "Recall OS guard passed: changed source is accompanied by test changes.\n";
  }

  const lines = [
    "Recall OS guard failed: source changed without any accompanying test changes.",
    "",
    "Source files changed with no test changes:",
    ...result.sourceFiles.map((file) => `- ${file}`),
    "",
    "Add or update a test for this change, or bypass intentionally (for example, git commit --no-verify).",
  ];

  return `${lines.join("\n")}\n`;
}
