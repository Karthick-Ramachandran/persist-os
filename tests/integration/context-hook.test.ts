import { execFile, spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createTempRoot,
  removeTempRoot,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

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
  timeoutMs = 30_000,
): Promise<{ stdout: string; exitCode: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
      cwd: rootDir,
      env: { ...process.env },
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

function hookInput(prompt: string): string {
  return `${JSON.stringify({
    session_id: "abc123",
    transcript_path: "/tmp/transcript.jsonl",
    cwd: "/repo",
    permission_mode: "default",
    hook_event_name: "UserPromptSubmit",
    prompt,
  })}\n`;
}

describe("persist context --hook over a pipe", () => {
  const roots: string[] = [];

  beforeAll(async () => {
    await execFileAsync("pnpm", ["build"], { cwd: process.cwd() });
  }, 120_000);

  afterAll(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function repoWithCard(): Promise<string> {
    const rootDir = await createTempRoot("context-hook-pipe");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    await mkdir(path.join(rootDir, "docs/context"), { recursive: true });
    await writeFile(
      path.join(rootDir, "docs/context/billing.md"),
      [
        "# Billing",
        "",
        "## Purpose",
        "",
        "Charges.",
        "",
        "## Answers",
        "",
        "- who pays the extra cent on invoices",
        "",
        "## Also Known As",
        "",
        "- billing",
        "",
        "## Start Here",
        "",
        "- `src/lib/billing.ts` — charges",
        "",
        "## Rules",
        "",
        "- ADR-0001 — a recorded decision",
        "",
        "## Pitfalls",
        "",
        "- LESSONS: a mistake",
        "",
        "## Applies To",
        "",
        "- `src/lib/billing.ts`",
        "",
      ].join("\n"),
      "utf8",
    );
    return rootDir;
  }

  it("answers a real Claude Code hook payload with pointers", async () => {
    const rootDir = await repoWithCard();

    const result = await runPiped(
      ["context", "--hook", "claude"],
      rootDir,
      hookInput("who pays the extra cent"),
    );

    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout) as {
      hookSpecificOutput: { hookEventName: string; additionalContext: string };
    };
    expect(parsed.hookSpecificOutput.hookEventName).toBe("UserPromptSubmit");
    expect(parsed.hookSpecificOutput.additionalContext).toContain("Billing");
  });

  it("prints nothing and exits 0 below the threshold", async () => {
    const rootDir = await repoWithCard();

    const result = await runPiped(
      ["context", "--hook", "codex"],
      rootDir,
      hookInput("write a haiku about spring"),
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("");
  });
});
