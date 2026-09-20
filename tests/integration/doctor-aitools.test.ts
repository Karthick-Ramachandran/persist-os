import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

describe("doctor honors init --ai-tools selection", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function requiredFileErrors(rootDir: string): Promise<string[]> {
    const result = await runCommand(rootDir, ["doctor"]);
    return result.stdout
      .split("\n")
      .filter((line) => line.includes("Required file is missing"))
      .map((line) => line.trim());
  }

  it("codex-only init passes doctor without CLAUDE.md", async () => {
    const rootDir = await createRoot("doctor-aitools-codex");
    const init = await runInitCommand(rootDir, ["--ai-tools", "codex"]);
    expect(init.exitCode).toBe(0);

    const errors = await requiredFileErrors(rootDir);
    expect(errors).toEqual([]);

    const doctor = await runCommand(rootDir, ["doctor"]);
    expect(doctor.exitCode).toBe(0);
  });

  it("cursor-only init passes doctor without CLAUDE.md", async () => {
    const rootDir = await createRoot("doctor-aitools-cursor");
    await runInitCommand(rootDir, ["--ai-tools", "cursor"]);

    const errors = await requiredFileErrors(rootDir);
    expect(errors).toEqual([]);

    const doctor = await runCommand(rootDir, ["doctor"]);
    expect(doctor.exitCode).toBe(0);
  });

  it("generic-only init passes doctor with AGENTS.md alone", async () => {
    const rootDir = await createRoot("doctor-aitools-generic");
    await runInitCommand(rootDir, ["--ai-tools", "generic"]);

    const errors = await requiredFileErrors(rootDir);
    expect(errors).toEqual([]);
  });

  it("claude-only init still requires CLAUDE.md", async () => {
    const rootDir = await createRoot("doctor-aitools-claude");
    await runInitCommand(rootDir, ["--ai-tools", "claude"]);

    const errors = await requiredFileErrors(rootDir);
    expect(errors).toEqual([]);
  });

  it("claude+codex init does not require the Cursor rule", async () => {
    const rootDir = await createRoot("doctor-aitools-claude-codex");
    await runInitCommand(rootDir, ["--ai-tools", "claude,codex"]);

    const errors = await requiredFileErrors(rootDir);
    expect(errors).toEqual([]);
  });

  it("default init still requires all three entry files", async () => {
    const rootDir = await createRoot("doctor-aitools-default");
    await runInitCommand(rootDir, []);

    const errors = await requiredFileErrors(rootDir);
    expect(errors).toEqual([]);
  });
});
