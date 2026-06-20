import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createWritePlan } from "../../src/core/filesystem/write-plan.js";
import { executeWritePlan } from "../../src/core/filesystem/write-file-safe.js";

let rootDir: string;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(os.tmpdir(), "specforge-overwrite-security-"));
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

describe("overwrite policy security", () => {
  it("skips existing files by default", async () => {
    await mkdir(path.join(rootDir, "docs"), { recursive: true });
    await writeFile(path.join(rootDir, "docs", "A.md"), "existing", "utf8");

    const plan = createWritePlan({
      rootDir,
      files: [{ path: "docs/A.md", content: "new" }]
    });
    const result = await executeWritePlan(plan);

    expect(result.skipped).toEqual(["docs/A.md"]);
    await expect(readFile(path.join(rootDir, "docs", "A.md"), "utf8")).resolves.toBe(
      "existing"
    );
  });

  it("force overwrite does not bypass path safety", () => {
    const plan = createWritePlan({
      rootDir,
      force: true,
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
  });
});
