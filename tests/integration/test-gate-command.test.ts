import { writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runTestGate } from "../../src/commands/test-gate.js";
import {
  createTempRoot,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

describe("test-gate command", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function writeConfig(rootDir: string, testCommand: string | null): Promise<void> {
    await runInitCommand(rootDir);
    const configPath = path.join(rootDir, ".persist", "config.json");
    const { readFile } = await import("node:fs/promises");
    const config = JSON.parse(await readFile(configPath, "utf8")) as Record<string, unknown>;
    config.testCommand = testCommand;
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  }

  // The gate splits commands on whitespace and runs them without a shell, so test
  // scripts live in files (argv-safe) rather than quoted `node -e` one-liners.
  async function writeScript(rootDir: string, name: string, body: string): Promise<string> {
    const scriptPath = path.join(rootDir, name);
    await writeFile(scriptPath, body, "utf8");
    return `node ${scriptPath}`;
  }

  it("passes a genuinely passing test command with visible output", async () => {
    const rootDir = await createRoot("gate-pass");
    const command = await writeScript(rootDir, "pass.js", "console.log('all-green');\n");

    const result = await runTestGate({ rootDir, testCommand: command });

    expect(result.status).toBe("passed");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("all-green");
  });

  it("fails a genuinely failing command, mirroring its exit code and output", async () => {
    const rootDir = await createRoot("gate-fail");
    const command = await writeScript(
      rootDir,
      "fail.js",
      "console.log('boom');\nprocess.exit(3);\n",
    );

    const result = await runTestGate({ rootDir, testCommand: command });

    expect(result.status).toBe("failed");
    expect(result.exitCode).toBe(3);
    expect(result.stdout).toContain("boom");
  });

  it("reads the command from config through the CLI", async () => {
    const rootDir = await createRoot("gate-cli");
    const command = await writeScript(rootDir, "fail.js", "process.exit(1);\n");
    await writeConfig(rootDir, command);

    const result = await runCommand(rootDir, ["test-gate"]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("test gate failed");
  });

  it("skips loudly when testCommand is null", async () => {
    const rootDir = await createRoot("gate-unconfigured");
    await writeConfig(rootDir, null);

    const result = await runCommand(rootDir, ["test-gate"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("skipped");
    expect(result.stdout).toContain("testCommand");
    expect(result.stdout).toContain("persist init");
  });

  it("treats a legacy config without testCommand as unconfigured, not broken", async () => {
    const rootDir = await createRoot("gate-legacy");
    await runInitCommand(rootDir);
    const configPath = path.join(rootDir, ".persist", "config.json");
    const { readFile } = await import("node:fs/promises");
    const config = JSON.parse(await readFile(configPath, "utf8")) as Record<string, unknown>;
    delete config.testCommand;
    delete config.prePushGates;
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

    const result = await runCommand(rootDir, ["test-gate"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("skipped");
    expect(result.stdout).toContain("testCommand");
  });
});
