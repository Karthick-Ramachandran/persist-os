import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runDoctor } from "../../src/core/doctor/doctor-check.js";
import {
  createTempRoot,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

function git(rootDir: string, ...args: string[]): void {
  execFileSync("git", args, { cwd: rootDir, stdio: "ignore" });
}

async function write(rootDir: string, relativePath: string, content: string): Promise<void> {
  const full = path.join(rootDir, relativePath);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, content, "utf8");
}

async function setFenceEnabled(rootDir: string, enabled: boolean): Promise<void> {
  const configPath = path.join(rootDir, ".persist/config.json");
  const config = JSON.parse(await readFile(configPath, "utf8")) as Record<string, unknown>;
  config.fenceEnabled = enabled;
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

describe("doctor fence integration", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("fires a fence warning through runDoctor on a staged source change", async () => {
    const rootDir = await createRoot("fence-fires");
    await runInitCommand(rootDir);
    git(rootDir, "init");
    await write(rootDir, "src/ledger.ts", "export const ledger = 1;\n");
    git(rootDir, "add", "src/ledger.ts");

    const report = await runDoctor(rootDir);

    expect(report.checks).toContainEqual({ id: "fence", status: "evaluated" });
    expect(report.findings).toContainEqual(
      expect.objectContaining({ severity: "warning", check: "fence", path: "src/ledger.ts" }),
    );
  });

  it("reports not-evaluated for a disabled fence and exits without fence findings", async () => {
    const rootDir = await createRoot("fence-off");
    await runInitCommand(rootDir);
    await setFenceEnabled(rootDir, false);
    git(rootDir, "init");
    await write(rootDir, "src/ledger.ts", "export const ledger = 1;\n");
    git(rootDir, "add", "src/ledger.ts");

    const report = await runDoctor(rootDir);

    expect(report.checks).toContainEqual({
      id: "fence",
      status: "not-evaluated",
      reason: expect.stringContaining("disabled"),
    });
    expect(report.findings.filter((finding) => finding.check === "fence")).toEqual([]);

    const result = await runCommand(rootDir, ["doctor", "--json"]);
    const parsed = JSON.parse(result.stdout) as {
      checks: { id: string; status: string; reason?: string }[];
    };
    expect(parsed.checks.find((check) => check.id === "fence")?.status).toBe("not-evaluated");
  });
});
