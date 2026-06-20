import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveSafePath } from "../../src/core/filesystem/safe-path.js";
import { createWritePlan } from "../../src/core/filesystem/write-plan.js";
import { slugify } from "../../src/core/naming/slugify.js";

let rootDir: string;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(os.tmpdir(), "specforge-path-security-"));
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

describe("path traversal security", () => {
  it("rejects traversal in names instead of sanitizing to safe-looking slugs", () => {
    expect(() => slugify("../../evil")).toThrow();
  });

  it("rejects traversal and absolute paths in output paths", () => {
    expect(() => resolveSafePath(rootDir, "../../evil")).toThrow();
    expect(() => resolveSafePath(rootDir, "/tmp/evil")).toThrow();
    expect(() => resolveSafePath(rootDir, "C:/tmp/evil")).toThrow();
  });

  it("surfaces unsafe paths as write plan errors", () => {
    const plan = createWritePlan({
      rootDir,
      files: [{ path: "../../evil", content: "evil" }]
    });

    expect(plan.hasErrors).toBe(true);
    expect(plan.entries[0]?.action).toBe("error");
  });
});
