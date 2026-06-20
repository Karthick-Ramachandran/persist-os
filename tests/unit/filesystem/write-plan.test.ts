import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createWritePlan } from "../../../src/core/filesystem/write-plan.js";

let rootDir: string;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(os.tmpdir(), "specforge-write-plan-"));
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

describe("createWritePlan", () => {
  it("classifies new files as create and preserves input order", () => {
    const plan = createWritePlan({
      rootDir,
      files: [
        { path: "docs/B.md", content: "B" },
        { path: "docs/A.md", content: "A" }
      ]
    });

    expect(plan.hasErrors).toBe(false);
    expect(plan.entries.map((entry) => entry.path)).toEqual(["docs/B.md", "docs/A.md"]);
    expect(plan.entries.map((entry) => entry.action)).toEqual(["create", "create"]);
  });

  it("skips existing files by default", async () => {
    await mkdir(path.join(rootDir, "docs"), { recursive: true });
    await writeFile(path.join(rootDir, "docs", "A.md"), "existing", "utf8");
    const realRoot = await realpath(rootDir);

    const plan = createWritePlan({
      rootDir,
      files: [{ path: "docs/A.md", content: "new" }]
    });

    expect(plan.hasErrors).toBe(false);
    expect(plan.entries).toEqual([
      {
        action: "skip",
        path: "docs/A.md",
        absolutePath: path.join(realRoot, "docs", "A.md"),
        reason: "File already exists."
      }
    ]);
  });

  it("marks existing files for overwrite when policy is explicit", async () => {
    await mkdir(path.join(rootDir, "docs"), { recursive: true });
    await writeFile(path.join(rootDir, "docs", "A.md"), "existing", "utf8");

    const plan = createWritePlan({
      rootDir,
      policy: "overwrite",
      files: [{ path: "docs/A.md", content: "new" }]
    });

    expect(plan.hasErrors).toBe(false);
    expect(plan.entries[0]?.action).toBe("overwrite");
  });

  it("reports errors for unsafe paths", () => {
    const plan = createWritePlan({
      rootDir,
      files: [{ path: "../evil.md", content: "evil" }]
    });

    expect(plan.hasErrors).toBe(true);
    expect(plan.entries[0]?.action).toBe("error");
  });

  it("rejects duplicate normalized destinations", () => {
    const plan = createWritePlan({
      rootDir,
      files: [
        { path: "docs/A.md", content: "A" },
        { path: "docs/./A.md", content: "duplicate" }
      ]
    });

    expect(plan.hasErrors).toBe(true);
    expect(plan.entries.map((entry) => entry.action)).toEqual(["create", "error"]);
  });
});
