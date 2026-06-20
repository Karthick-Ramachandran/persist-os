import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createWritePlan } from "../../../src/core/filesystem/write-plan.js";
import {
  executeWritePlan,
  WriteSafetyError,
} from "../../../src/core/filesystem/write-file-safe.js";

let rootDir: string;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(os.tmpdir(), "recall-write-file-"));
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

describe("executeWritePlan", () => {
  it("writes create entries and makes parent directories", async () => {
    const plan = createWritePlan({
      rootDir,
      files: [{ path: "docs/A.md", content: "hello" }],
    });

    const result = await executeWritePlan(plan);

    expect(result.created).toEqual(["docs/A.md"]);
    await expect(readFile(path.join(rootDir, "docs", "A.md"), "utf8")).resolves.toBe("hello");
  });

  it("writes executable entries with the owner execute bit set", async () => {
    const plan = createWritePlan({
      rootDir,
      files: [{ path: ".recall/hooks/pre-commit", content: "#!/bin/sh\n", executable: true }],
    });

    await executeWritePlan(plan);

    const mode = (await stat(path.join(rootDir, ".recall/hooks/pre-commit"))).mode;
    expect(mode & 0o100).toBe(0o100);
  });

  it("skips existing files by default", async () => {
    await mkdir(path.join(rootDir, "docs"), { recursive: true });
    await writeFile(path.join(rootDir, "docs", "A.md"), "existing", "utf8");

    const plan = createWritePlan({
      rootDir,
      files: [{ path: "docs/A.md", content: "new" }],
    });

    const result = await executeWritePlan(plan);

    expect(result.skipped).toEqual(["docs/A.md"]);
    await expect(readFile(path.join(rootDir, "docs", "A.md"), "utf8")).resolves.toBe("existing");
  });

  it("overwrites only when the plan explicitly marks overwrite", async () => {
    await mkdir(path.join(rootDir, "docs"), { recursive: true });
    await writeFile(path.join(rootDir, "docs", "A.md"), "existing", "utf8");

    const plan = createWritePlan({
      rootDir,
      policy: "overwrite",
      files: [{ path: "docs/A.md", content: "new" }],
    });

    const result = await executeWritePlan(plan);

    expect(result.overwritten).toEqual(["docs/A.md"]);
    await expect(readFile(path.join(rootDir, "docs", "A.md"), "utf8")).resolves.toBe("new");
  });

  it("dry run performs zero writes", async () => {
    const plan = createWritePlan({
      rootDir,
      files: [{ path: "docs/A.md", content: "hello" }],
    });

    const result = await executeWritePlan(plan, { dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(result.created).toEqual(["docs/A.md"]);
    await expect(readFile(path.join(rootDir, "docs", "A.md"), "utf8")).rejects.toThrow();
  });

  it("refuses to execute a plan with errors", async () => {
    const plan = createWritePlan({
      rootDir,
      files: [
        { path: "docs/A.md", content: "safe" },
        { path: "../evil.md", content: "evil" },
      ],
    });

    await expect(executeWritePlan(plan)).rejects.toThrow(WriteSafetyError);
    await expect(readFile(path.join(rootDir, "docs", "A.md"), "utf8")).rejects.toThrow();
  });

  it("does not overwrite files that appear after planning create entries", async () => {
    const plan = createWritePlan({
      rootDir,
      files: [{ path: "docs/A.md", content: "planned" }],
    });

    await mkdir(path.join(rootDir, "docs"), { recursive: true });
    await writeFile(path.join(rootDir, "docs", "A.md"), "late existing", "utf8");

    await expect(executeWritePlan(plan)).rejects.toThrow();
    await expect(readFile(path.join(rootDir, "docs", "A.md"), "utf8")).resolves.toBe(
      "late existing",
    );
  });
});
