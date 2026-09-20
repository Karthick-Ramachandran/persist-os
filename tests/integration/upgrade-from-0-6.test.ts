import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  removeTempRoot,
  runCommand,
} from "../helpers/init-test-helpers.js";

/**
 * ADR-0011 makes 1.0.0 a stability promise, and names this the test that actually backs it:
 * "An upgrade test proves a repository initialised on 0.6.x still works on 1.0."
 *
 * 1.0 removes `preset` from the config schema and deletes `guard`, so every repository initialised
 * on 0.6.x has a config that no longer parses and hooks that call a command that is gone. These
 * tests fix what that upgrade looks like: the failure must name the edit, nothing may be silently
 * discarded, and the machine-readable report must stay readable for anyone scripting against it.
 */

/** The config shape `persist init` wrote on 0.6.2, verbatim. */
const CONFIG_0_6_2 = {
  version: "0.6.2",
  templateVersion: "0.6.2",
  preset: null,
  memoryProfile: "standard",
  mode: "standard",
  writePolicy: "skip-existing",
  aiTools: ["claude", "codex", "cursor"],
  docsDir: "docs",
  featuresDir: "docs/40-features",
  modulesDir: "docs/30-modules",
  adrDir: "docs/adrs",
  preCommitGates: [],
};

/** The nine files `persist feature create` wrote on 0.6.x. */
const FEATURE_DOCS_0_6 = [
  "PRD.md",
  "ACCEPTANCE.md",
  "ARCHITECTURE_IMPACT.md",
  "CHANGE_REQUESTS.md",
  "PLAN.md",
  "TASKS.md",
  "TEST_PLAN.md",
  "REVIEW.md",
  "COMPLETION_REPORT.md",
];

/** Catalog skills that 1.0 retired. A 0.6.x repository still has these directories on disk. */
const RETIRED_SKILLS = [
  "create-prd",
  "create-adr",
  "plan-module",
  "implement-task",
  "write-tests",
  "update-module-memory",
  "completion-report",
  "capture-mcp-context",
  "architecture-drift-review",
];

describe("upgrading a 0.6.x repository to 1.0", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function write(rootDir: string, relativePath: string, content: string): Promise<void> {
    const full = path.join(rootDir, relativePath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, "utf8");
  }

  /** Build a repository in the shape 0.6.x left behind. */
  async function createRepoAsInitialisedOn0_6(
    prefix: string,
    configOverrides: Record<string, unknown> = {},
  ): Promise<string> {
    const rootDir = await createRoot(prefix);

    await write(
      rootDir,
      ".persist/config.json",
      `${JSON.stringify({ ...CONFIG_0_6_2, ...configOverrides }, null, 2)}\n`,
    );

    await write(rootDir, "AGENTS.md", "# Agents\n\nRepository memory entry point.\n");
    await write(rootDir, "CLAUDE.md", "# Claude\n\nRepository memory entry point.\n");

    for (const doc of FEATURE_DOCS_0_6) {
      await write(
        rootDir,
        `docs/40-features/F-001-legacy-feature/${doc}`,
        `# ${doc}\n\nContent written on 0.6.x.\n`,
      );
    }

    for (const name of RETIRED_SKILLS) {
      await write(
        rootDir,
        `.claude/skills/${name}/SKILL.md`,
        `---\nname: ${name}\ndescription: "Retired in 1.0."\n---\n\n# ${name}\n`,
      );
    }

    return rootDir;
  }

  it("fails on the retired preset field and names the exact edit", async () => {
    const rootDir = await createRepoAsInitialisedOn0_6("upgrade-preset");

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain("preset");
    // Naming the file and the action is the whole point: an upgrade that only says "invalid
    // config" leaves the user guessing at the one line they have to delete.
    expect(result.stdout).toContain(".persist/config.json");
    expect(result.stdout).toMatch(/delete|remove/iu);
  });

  it("loads once the preset line is deleted, keeping the other 0.6 fields", async () => {
    const rootDir = await createRoot("upgrade-preset-removed");
    const withoutPreset: Record<string, unknown> = { ...CONFIG_0_6_2 };
    delete withoutPreset.preset;

    await write(rootDir, ".persist/config.json", `${JSON.stringify(withoutPreset, null, 2)}\n`);
    await write(rootDir, "AGENTS.md", "# Agents\n");
    await write(rootDir, "CLAUDE.md", "# Claude\n");

    const result = await runCommand(rootDir, ["doctor"]);

    // memoryProfile, mode and writePolicy are deprecated but still accepted on read, so a 0.6
    // config minus one line must not produce a config error.
    expect(result.stdout).not.toContain("Invalid Persist OS config");
  });

  it("reports retired skill directories without deleting them", async () => {
    const rootDir = await createRepoAsInitialisedOn0_6("upgrade-skills", { preset: undefined });

    const result = await runCommand(rootDir, ["doctor"]);
    const files = await listRelativeFiles(rootDir);

    for (const name of RETIRED_SKILLS) {
      expect(result.stdout).toContain(name);
      // Persist OS never deletes a user's files to satisfy a check.
      expect(files).toContain(`.claude/skills/${name}/SKILL.md`);
    }
  });

  it("leaves 0.6 feature memory on disk", async () => {
    const rootDir = await createRepoAsInitialisedOn0_6("upgrade-feature-docs", {
      preset: undefined,
    });

    await runCommand(rootDir, ["doctor"]);
    const files = await listRelativeFiles(rootDir);

    // Features are opt-in in 1.0, but an existing nine-file folder is memory someone wrote. It is
    // not migrated and it is not removed.
    for (const doc of FEATURE_DOCS_0_6) {
      expect(files).toContain(`docs/40-features/F-001-legacy-feature/${doc}`);
    }
  });

  it("keeps --json parseable through the upgrade failure", async () => {
    const rootDir = await createRepoAsInitialisedOn0_6("upgrade-json");

    const result = await runCommand(rootDir, ["doctor", "--json"]);
    const parsed = JSON.parse(result.stdout) as {
      schemaVersion: string;
      status: string;
      exitCode: number;
      summary: { errors: number };
      findings: unknown[];
      checks: { id: string; status: string }[];
    };

    // Anyone scripting against doctor hits this shape first on upgrade. It has to survive the
    // config being unreadable.
    expect(parsed.schemaVersion).toBe("persist.doctor.v1");
    expect(parsed.status).toBe("failed");
    expect(parsed.exitCode).toBe(2);
    expect(parsed.summary.errors).toBeGreaterThan(0);
    expect(Array.isArray(parsed.checks)).toBe(true);
    // The config is unreadable, so the config-gated checks must say so rather than pass.
    expect(parsed.checks.some((check) => check.status === "not-evaluated")).toBe(true);
  });
});
