import { appendFile, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  readGeneratedFile,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

/**
 * `hooks sync` is the repair doctor's hook-drift warning points at. The warning used to say
 * `init --force --reinit`, which rewrote every generated file — a filled-in PRODUCT.md came back
 * as the template — and reset the config to defaults. Following a doctor warning must never
 * cost a repository its memory, so these tests pin what sync leaves alone as much as what it
 * writes.
 */
describe("persist hooks sync", () => {
  const roots: string[] = [];

  async function initRoot(prefix: string, args: string[] = ["--yes"]): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    await runInitCommand(rootDir, args);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function editConfig(rootDir: string, patch: Record<string, unknown>): Promise<void> {
    const configPath = path.join(rootDir, ".persist/config.json");
    const config = JSON.parse(await readFile(configPath, "utf8")) as Record<string, unknown>;
    await writeFile(configPath, `${JSON.stringify({ ...config, ...patch }, null, 2)}\n`, "utf8");
  }

  it("repairs a drifted hook, and doctor stops flagging it", async () => {
    const rootDir = await initRoot("hooks-sync-drift");
    await appendFile(path.join(rootDir, ".claude/hooks/session-start.sh"), "# hand edit\n");

    const before = await runCommand(rootDir, ["doctor"]);
    expect(before.stdout).toContain(".claude/hooks/session-start.sh");
    // The warning names the safe repair, never the one that wipes memory.
    expect(before.stdout).toContain("persist hooks sync");
    expect(before.stdout).not.toContain("--reinit");

    const sync = await runCommand(rootDir, ["hooks", "sync"]);
    expect(sync.exitCode).toBe(0);
    expect(sync.stdout).toContain("Overwritten:\n- .claude/hooks/session-start.sh");

    const after = await runCommand(rootDir, ["doctor"]);
    expect(after.stdout).not.toContain("Generated file disagrees");
  });

  it("never touches docs, config, or agent files", async () => {
    const rootDir = await initRoot("hooks-sync-safe");
    await writeFile(path.join(rootDir, "docs/00-product/PRODUCT.md"), "# My product\n", "utf8");
    await writeFile(path.join(rootDir, "AGENTS.md"), "# My agents\n", "utf8");
    await editConfig(rootDir, { docsDir: "docs", testCommand: "npm test" });
    const config = await readGeneratedFile(rootDir, ".persist/config.json");
    await appendFile(path.join(rootDir, ".persist/hooks/pre-commit"), "# hand edit\n");

    await runCommand(rootDir, ["hooks", "sync"]);

    expect(await readGeneratedFile(rootDir, "docs/00-product/PRODUCT.md")).toBe("# My product\n");
    expect(await readGeneratedFile(rootDir, "AGENTS.md")).toBe("# My agents\n");
    expect(await readGeneratedFile(rootDir, ".persist/config.json")).toBe(config);
  });

  it("renders hooks from the current config", async () => {
    const rootDir = await initRoot("hooks-sync-config");
    await editConfig(rootDir, { testCommand: "npm run check", prePushGates: ["npm run lint"] });

    await runCommand(rootDir, ["hooks", "sync"]);

    const prePush = await readGeneratedFile(rootDir, ".persist/hooks/pre-push");
    expect(prePush).toContain("npm run lint");
    expect((await runCommand(rootDir, ["doctor"])).stdout).not.toContain("hook-drift");
  });

  it("leaves Claude settings with the user's own entries alone", async () => {
    const rootDir = await initRoot("hooks-sync-settings");
    const mine = '{"permissions":{"allow":["Bash(ls)"]}}\n';
    await writeFile(path.join(rootDir, ".claude/settings.json"), mine, "utf8");

    const sync = await runCommand(rootDir, ["hooks", "sync"]);

    expect(await readGeneratedFile(rootDir, ".claude/settings.json")).toBe(mine);
    expect(sync.stdout).toContain(".claude/settings.json has your own settings");
  });

  it("creates Claude settings when they are missing", async () => {
    const rootDir = await initRoot("hooks-sync-settings-missing");
    await rm(path.join(rootDir, ".claude/settings.json"));

    await runCommand(rootDir, ["hooks", "sync"]);

    expect(await readGeneratedFile(rootDir, ".claude/settings.json")).toContain("SessionStart");
  });

  it("reports identical hooks as unchanged instead of rewriting them", async () => {
    const rootDir = await initRoot("hooks-sync-clean");

    const sync = await runCommand(rootDir, ["hooks", "sync"]);

    expect(sync.stdout).not.toContain("Overwritten");
    expect(sync.stdout).toContain("Unchanged:");
  });

  it("writes nothing on --dry-run", async () => {
    const rootDir = await initRoot("hooks-sync-dry");
    const hookPath = path.join(rootDir, ".persist/hooks/pre-commit");
    await appendFile(hookPath, "# hand edit\n");
    const drifted = await readFile(hookPath, "utf8");

    const sync = await runCommand(rootDir, ["hooks", "sync", "--dry-run"]);

    expect(sync.stdout).toContain("Planned overwrites:\n- .persist/hooks/pre-commit");
    expect(await readFile(hookPath, "utf8")).toBe(drifted);
  });

  it("writes no Claude files for a repository that did not ask for Claude", async () => {
    const rootDir = await initRoot("hooks-sync-codex", ["--yes", "--ai-tools", "codex"]);

    await runCommand(rootDir, ["hooks", "sync"]);

    const files = await listRelativeFiles(rootDir);
    expect(files.some((file) => file.startsWith(".claude/"))).toBe(false);
  });

  it("refuses outside a Persist repository", async () => {
    const rootDir = await createTempRoot("hooks-sync-bare");
    roots.push(rootDir);

    const result = await runCommand(rootDir, ["hooks", "sync"]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toMatch(/persist init/u);
    expect(await listRelativeFiles(rootDir)).toEqual([]);
  });
});
