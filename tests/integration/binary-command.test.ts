import { execFile, spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const cliPath = path.join(process.cwd(), "dist", "cli.js");

/**
 * Run the built CLI with piped stdin. The pipe is never a TTY, and the
 * timeout kills a hanging child so a prompt regression fails the suite
 * instead of wedging CI.
 */
async function runPiped(
  args: string[],
  rootDir: string,
  stdinText: string,
  extraEnv: NodeJS.ProcessEnv = {},
  timeoutMs = 30_000,
): Promise<{ stdout: string; exitCode: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
      cwd: rootDir,
      env: { ...process.env, ...extraEnv },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`timed out after ${timeoutMs}ms waiting for ${args.join(" ")}`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, exitCode: code });
    });

    child.stdin.write(stdinText);
    child.stdin.end();
  });
}

describe("built persist binary", () => {
  const roots: string[] = [];

  beforeAll(async () => {
    await execFileAsync("pnpm", ["build"], { cwd: process.cwd() });
  }, 30_000);

  afterAll(async () => {
    await Promise.all(roots.map((rootDir) => rm(rootDir, { recursive: true, force: true })));
  });

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), `persist-binary-${prefix}-`));
    roots.push(rootDir);
    return rootDir;
  }

  it("runs help from the built CLI entrypoint", async () => {
    const { stdout } = await execFileAsync(process.execPath, [cliPath, "--help"]);

    expect(stdout).toContain("Usage: persist");
    expect(stdout).toContain("doctor");
  });

  it("initializes an empty folder and runs doctor", async () => {
    const rootDir = await createRoot("init");

    const initResult = await execFileAsync(process.execPath, [cliPath, "init"], {
      cwd: rootDir,
    });
    expect(initResult.stdout).toContain("Persist OS init complete.");

    const doctorResult = await execFileAsync(process.execPath, [cliPath, "doctor"], {
      cwd: rootDir,
    });
    expect(doctorResult.stdout).toContain("Result: PASSED");
  });

  it("completes piped empty stdin instead of hanging on a prompt", async () => {
    const rootDir = await createRoot("piped-init");

    const result = await runPiped(["init", "--dry-run"], rootDir, "");

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Planned creates");
    expect(result.stdout).toContain("stdin is not a TTY");
  }, 30_000);

  it("emits plain output over pipes unless forced", async () => {
    const plain = await runPiped(["init", "--yes"], await createRoot("piped-plain"), "");
    expect(plain.stdout).not.toContain("\x1b");

    const forced = await runPiped(["init", "--yes"], await createRoot("piped-forced"), "", {
      FORCE_COLOR: "1",
    });
    expect(forced.stdout).toContain("\x1b");
  }, 60_000);
});
