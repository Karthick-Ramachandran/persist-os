import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { main } from "../../src/cli/main.js";

export type InitCommandRun = {
  rootDir: string;
  exitCode: number;
  stdout: string;
  stderr: string;
};

export async function createTempRoot(prefix: string): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), `specforge-${prefix}-`));
}

export async function removeTempRoot(rootDir: string): Promise<void> {
  await rm(rootDir, { recursive: true, force: true });
}

export async function runInitCommand(
  rootDir: string,
  args: string[] = []
): Promise<InitCommandRun> {
  return runCommand(rootDir, ["init", ...args]);
}

export async function runCommand(
  rootDir: string,
  args: string[]
): Promise<InitCommandRun> {
  let stdout = "";
  let stderr = "";
  const exitCode = await main(args, {
    cwd: rootDir,
    stdout: {
      write(message) {
        stdout += message;
      }
    },
    stderr: {
      write(message) {
        stderr += message;
      }
    }
  });

  return {
    rootDir,
    exitCode,
    stdout,
    stderr
  };
}

export async function listRelativeFiles(rootDir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = path.relative(rootDir, absolutePath).split(path.sep).join("/");

      if (entry.isDirectory()) {
        await walk(absolutePath);
      } else {
        files.push(relativePath);
      }
    }
  }

  await walk(rootDir);

  return files.sort((left, right) => left.localeCompare(right));
}

export async function readGeneratedFile(rootDir: string, relativePath: string): Promise<string> {
  return readFile(path.join(rootDir, relativePath), "utf8");
}

export async function readGeneratedJson<T>(
  rootDir: string,
  relativePath: string
): Promise<T> {
  return JSON.parse(await readGeneratedFile(rootDir, relativePath)) as T;
}
