import { spawnSync } from "node:child_process";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

/**
 * The README documents moving the memory out of `docs/` by editing `.persist/config.json`. That
 * promise has to hold for every reader of the directories, not just doctor: the SessionStart hook
 * once read fixed `docs/` paths, so a relocated repository passed doctor while every session
 * loaded no ADRs, no modules, and no fence index.
 */
describe("relocated memory", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function relocatedRepo(): Promise<string> {
    const rootDir = await createTempRoot("relocated-memory");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);

    await rename(path.join(rootDir, "docs"), path.join(rootDir, ".memory"));
    const configPath = path.join(rootDir, ".persist/config.json");
    const config = JSON.parse(await readFile(configPath, "utf8")) as Record<string, unknown>;
    await writeFile(
      configPath,
      `${JSON.stringify(
        {
          ...config,
          docsDir: ".memory",
          featuresDir: ".memory/40-features",
          modulesDir: ".memory/30-modules",
          adrDir: ".memory/adrs",
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    return rootDir;
  }

  function sessionContext(rootDir: string): string {
    const result = spawnSync("sh", [".claude/hooks/session-start.sh"], {
      cwd: rootDir,
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    return (JSON.parse(result.stdout) as { hookSpecificOutput: { additionalContext: string } })
      .hookSpecificOutput.additionalContext;
  }

  it("passes doctor without asking for the hook to be regenerated", async () => {
    const rootDir = await relocatedRepo();

    const doctor = await runCommand(rootDir, ["doctor"]);

    expect(doctor.exitCode).toBe(0);
    expect(doctor.stdout).not.toContain("hook-drift");
    expect(doctor.stdout).not.toMatch(/Missing required/u);
  });

  it("writes new memory into the configured folders, and nothing back into docs/", async () => {
    const rootDir = await relocatedRepo();
    await mkdir(path.join(rootDir, "src"), { recursive: true });
    await writeFile(path.join(rootDir, "src/billing.ts"), "export const x = 1;\n", "utf8");

    await runCommand(rootDir, ["adr", "create", "Use a ledger"]);
    await runCommand(rootDir, ["module", "create", "billing"]);
    await runCommand(rootDir, ["fence", "add", "src/billing.ts", "--why", "Deliberate."]);

    const files = await listRelativeFiles(rootDir);
    expect(files.some((file) => file.startsWith(".memory/adrs/ADR-"))).toBe(true);
    expect(files.some((file) => file.startsWith(".memory/30-modules/billing/"))).toBe(true);
    expect(files).toContain(".memory/60-engineering/FENCES.md");
    expect(files.some((file) => file.startsWith("docs/"))).toBe(false);
  });

  it("loads ADRs, modules, and the fence index from the configured folders", async () => {
    const rootDir = await relocatedRepo();
    await mkdir(path.join(rootDir, "src"), { recursive: true });
    await writeFile(path.join(rootDir, "src/billing.ts"), "export const x = 1;\n", "utf8");
    await runCommand(rootDir, ["adr", "create", "Use a ledger"]);
    await runCommand(rootDir, ["module", "create", "billing"]);
    await runCommand(rootDir, [
      "fence",
      "add",
      "src/billing.ts",
      "--why",
      "Four writes on purpose.",
    ]);

    const context = sessionContext(rootDir);

    // `adr create` writes a Proposed ADR: it rides the pending-review list, never
    // the Accepted one (1.6.1 Part 3).
    expect(context).toContain("Accepted ADRs (.memory/adrs/): none yet.");
    expect(context).toMatch(/Proposed ADRs, pending review, not binding: ADR-\d+-use-a-ledger/);
    expect(context).toContain("Modules (.memory/30-modules/): billing");
    expect(context).toContain("Four writes on purpose.");
    expect(context).toContain(".memory/60-engineering/FENCES.md");
  });
});
