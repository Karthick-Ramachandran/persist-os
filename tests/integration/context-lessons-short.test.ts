import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { findContext, formatFindContextResult } from "../../src/commands/context/find.js";
import { hookContext } from "../../src/commands/context/hook.js";
import {
  createTempRoot,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

const FIXTURE = readFileSync(
  new URL("../fixtures/lessons-short-areas.md", import.meta.url),
  "utf8",
);

/** prompt → areas that must ride along → areas that must not. */
const PROMPTS: { task: string; include: string[]; exclude: string[] }[] = [
  {
    task: "check the studio checkbox",
    include: ["Review studio"],
    exclude: ["QC media checks", "Feature flags", "Billing", "Craft engine"],
  },
  {
    task: "the playwright checkbox does not flip",
    include: ["Review studio"],
    exclude: ["QC media checks", "Backups", "Craft engine"],
  },
  {
    task: "ffmpeg loudness summary",
    include: ["QC media checks"],
    exclude: ["Craft engine", "Backups", "Billing"],
  },
  {
    task: "revise loop made the cut worse",
    include: ["Craft engine"],
    exclude: ["Backups", "Billing", "Email delivery"],
  },
  {
    task: "prorated upgrade bills the remaining days twice",
    include: ["Billing"],
    exclude: ["Backups", "Craft engine", "Email delivery"],
  },
  {
    task: "bounced address suppresses future sends until re-verified",
    include: ["Email delivery"],
    exclude: ["Backups", "Billing", "Craft engine"],
  },
  {
    task: "rebuild the search index after a schema change",
    include: ["Search index"],
    exclude: ["Backups", "Billing", "Craft engine"],
  },
  {
    task: "a flag on for everyone is a constant remove it",
    include: ["Feature flags"],
    exclude: ["Email delivery", "Backups", "Billing"],
  },
  {
    task: "restore drill against a scratch account monthly",
    include: ["Backups"],
    exclude: ["Billing", "Craft engine", "Email delivery"],
  },
  {
    task: "dunning retries a failed charge before suspending",
    include: ["Billing"],
    exclude: ["QC media checks", "Craft engine", "Backups"],
  },
  {
    task: "rendered chip never appears after click",
    include: ["Review studio"],
    exclude: ["Feature flags", "Search index", "Backups"],
  },
  {
    task: "test the decrypt path each quarter",
    include: ["Backups"],
    exclude: ["Email delivery", "Feature flags", "Review studio"],
  },
];

describe("persist context with short lessons areas", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function fixtureRepo(): Promise<string> {
    const rootDir = await createTempRoot("context-lessons-short");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    await writeFile(path.join(rootDir, "docs/60-engineering/LESSONS.md"), FIXTURE, "utf8");
    return rootDir;
  }

  it.each(PROMPTS)('hands over $include for "$task"', async ({ task, include, exclude }) => {
    const rootDir = await fixtureRepo();
    const result = await runCommand(rootDir, ["context", task]);

    expect(result.exitCode).toBe(0);
    for (const area of include) {
      expect(result.stdout, `expected area "${area}"`).toContain(`Lesson — ${area}`);
    }
    for (const area of exclude) {
      expect(result.stdout, `unexpected area "${area}"`).not.toContain(`Lesson — ${area}`);
    }
    expect(result.stdout).toContain("More lessons:");
    expect(result.stdout).toContain("docs/60-engineering/LESSONS.md");
    expect(result.stdout).not.toContain("\n\n\n");
  });

  it("shows at most 3 bullets per area and at most 2 areas", async () => {
    const rootDir = await fixtureRepo();
    const found = await findContext({ rootDir, task: "check the studio checkbox" });

    expect(found.lessons.length).toBeGreaterThan(0);
    expect(found.lessons.length).toBeLessThanOrEqual(2);
    for (const lesson of found.lessons) {
      expect(lesson.bullets.length).toBeLessThanOrEqual(3);
    }
  });

  it("stays silent about lessons for an unrelated task", async () => {
    const rootDir = await fixtureRepo();
    const result = await runCommand(rootDir, ["context", "rename the settings button component"]);

    expect(result.stdout).not.toContain("Lesson —");
    expect(result.stdout).not.toContain("More lessons:");
  });

  it("keeps the More lessons index line under the hook byte cap", async () => {
    const rootDir = await fixtureRepo();
    const found = await findContext({ rootDir, task: "check the studio checkbox", limit: 2 });
    const capped = formatFindContextResult(found, { echoTask: false, maxBytes: 1500 });

    expect(Buffer.byteLength(capped, "utf8")).toBeLessThanOrEqual(1500);
    expect(capped).toContain("More lessons:");
  });

  it("answers a prompt hook with lessons when no card matches", async () => {
    const rootDir = await fixtureRepo();
    const result = await hookContext({
      rootDir,
      tool: "claude",
      rawInput: `${JSON.stringify({ prompt: "revise loop made the cut worse" })}\n`,
    });

    expect(result.matched).toBe(true);
    const parsed = JSON.parse(result.output) as {
      hookSpecificOutput: { additionalContext: string };
    };
    const injected = parsed.hookSpecificOutput.additionalContext;
    expect(injected).toContain("Lesson — Craft engine");
    expect(injected).toContain("More lessons:");
    expect(Buffer.byteLength(injected, "utf8")).toBeLessThanOrEqual(1500);
  });
});
