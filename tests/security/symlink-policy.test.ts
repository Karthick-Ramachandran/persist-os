import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createWritePlan } from "../../src/core/filesystem/write-plan.js";
import { executeWritePlan, WriteSafetyError } from "../../src/core/filesystem/write-file-safe.js";

let rootDir: string;
let outsideDir: string;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(os.tmpdir(), "specforge-symlink-security-root-"));
  outsideDir = await mkdtemp(path.join(os.tmpdir(), "specforge-symlink-security-outside-"));
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
  await rm(outsideDir, { recursive: true, force: true });
});

describe("symlink policy security", () => {
  it("refuses to write target symlinks", async () => {
    await mkdir(path.join(rootDir, "docs"), { recursive: true });
    await writeFile(path.join(outsideDir, "target.md"), "outside", "utf8");
    await symlink(path.join(outsideDir, "target.md"), path.join(rootDir, "docs", "A.md"));

    const plan = createWritePlan({
      rootDir,
      policy: "overwrite",
      files: [{ path: "docs/A.md", content: "new" }]
    });

    await expect(executeWritePlan(plan)).rejects.toThrow(WriteSafetyError);
    await expect(readFile(path.join(outsideDir, "target.md"), "utf8")).resolves.toBe(
      "outside"
    );
  });

  it("refuses to write through existing parent symlinks", async () => {
    await symlink(outsideDir, path.join(rootDir, "docs"));

    const plan = createWritePlan({
      rootDir,
      files: [{ path: "docs/A.md", content: "new" }]
    });

    await expect(executeWritePlan(plan)).rejects.toThrow(WriteSafetyError);
    await expect(readFile(path.join(outsideDir, "A.md"), "utf8")).rejects.toThrow();
  });
});
