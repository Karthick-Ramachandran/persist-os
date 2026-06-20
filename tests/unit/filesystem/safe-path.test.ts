import { mkdtemp, realpath, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  normalizeOutputPath,
  resolveSafePath,
  SafePathError
} from "../../../src/core/filesystem/safe-path.js";

let rootDir: string;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(os.tmpdir(), "specforge-safe-path-"));
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

describe("normalizeOutputPath", () => {
  it("normalizes dot segments and preserves safe dot-directories", () => {
    expect(normalizeOutputPath("docs/./A.md")).toBe("docs/A.md");
    expect(normalizeOutputPath(".specforge/config.json")).toBe(".specforge/config.json");
  });

  it("rejects unsafe path syntax", () => {
    expect(() => normalizeOutputPath("")).toThrow(SafePathError);
    expect(() => normalizeOutputPath("/tmp/evil")).toThrow(SafePathError);
    expect(() => normalizeOutputPath("C:/tmp/evil")).toThrow(SafePathError);
    expect(() => normalizeOutputPath("docs\\A.md")).toThrow(SafePathError);
    expect(() => normalizeOutputPath("docs/../evil.md")).toThrow(SafePathError);
    expect(() => normalizeOutputPath("docs//A.md")).toThrow(SafePathError);
    expect(() => normalizeOutputPath("docs/\u0000A.md")).toThrow(SafePathError);
    expect(() => normalizeOutputPath("docs/\nA.md")).toThrow(SafePathError);
  });
});

describe("resolveSafePath", () => {
  it("resolves safe paths inside the root directory", async () => {
    const resolved = resolveSafePath(rootDir, "docs/A.md");
    const realRoot = await realpath(rootDir);

    expect(resolved.path).toBe("docs/A.md");
    expect(resolved.absolutePath).toBe(path.join(realRoot, "docs", "A.md"));
  });

  it("rejects paths that escape the project root", () => {
    expect(() => resolveSafePath(rootDir, "../../evil")).toThrow(SafePathError);
    expect(() => resolveSafePath(rootDir, "..")).toThrow(SafePathError);
  });
});
