import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  formatFeatureNumber,
  getFeatureFolderForSlug,
  getNextFeatureNumber,
  parseFeatureNumber
} from "../../../src/core/naming/feature-number.js";

describe("feature number", () => {
  const roots: string[] = [];

  async function createRoot(): Promise<string> {
    const rootDir = path.join(tmpdir(), `specforge-feature-number-${randomUUID()}`);
    roots.push(rootDir);
    await mkdir(rootDir, { recursive: true });
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(
      roots.splice(0).map((rootDir) => rm(rootDir, { recursive: true, force: true }))
    );
  });

  it("starts at F-001 when no feature directory exists", async () => {
    const rootDir = await createRoot();
    const featureNumber = await getNextFeatureNumber(path.join(rootDir, "docs/40-features"));

    expect(featureNumber).toEqual({
      number: 1,
      id: "F-001"
    });
  });

  it("increments from the highest valid existing feature folder", async () => {
    const rootDir = await createRoot();
    const featuresDir = path.join(rootDir, "docs/40-features");
    await mkdir(path.join(featuresDir, "F-001-auth-provider"), { recursive: true });
    await mkdir(path.join(featuresDir, "F-007-billing"), { recursive: true });
    await mkdir(path.join(featuresDir, "F-003-checkout"), { recursive: true });

    expect(await getNextFeatureNumber(featuresDir)).toEqual({
      number: 8,
      id: "F-008"
    });
  });

  it("ignores malformed feature folders", async () => {
    const rootDir = await createRoot();
    const featuresDir = path.join(rootDir, "docs/40-features");
    await mkdir(path.join(featuresDir, "F-001-auth-provider"), { recursive: true });
    await mkdir(path.join(featuresDir, "F-999"), { recursive: true });
    await mkdir(path.join(featuresDir, "feature-1000"), { recursive: true });
    await mkdir(path.join(featuresDir, "F-abc-bad"), { recursive: true });
    await mkdir(path.join(featuresDir, "F-010-Bad-Case"), { recursive: true });

    expect(await getNextFeatureNumber(featuresDir)).toEqual({
      number: 2,
      id: "F-002"
    });
  });

  it("reuses an existing feature folder for the same slug", async () => {
    const rootDir = await createRoot();
    const featuresDir = path.join(rootDir, "docs/40-features");
    await mkdir(path.join(featuresDir, "F-001-auth-provider"), { recursive: true });
    await mkdir(path.join(featuresDir, "F-007-billing"), { recursive: true });

    expect(await getFeatureFolderForSlug(featuresDir, "auth-provider")).toEqual({
      number: 1,
      id: "F-001",
      slug: "auth-provider",
      folderName: "F-001-auth-provider"
    });
  });

  it("allocates the next feature folder for a new slug", async () => {
    const rootDir = await createRoot();
    const featuresDir = path.join(rootDir, "docs/40-features");
    await mkdir(path.join(featuresDir, "F-001-auth-provider"), { recursive: true });
    await mkdir(path.join(featuresDir, "F-007-billing"), { recursive: true });

    expect(await getFeatureFolderForSlug(featuresDir, "checkout")).toEqual({
      number: 8,
      id: "F-008",
      slug: "checkout",
      folderName: "F-008-checkout"
    });
  });

  it("parses and formats valid feature numbers", () => {
    expect(parseFeatureNumber("F-001-auth-provider")).toBe(1);
    expect(parseFeatureNumber("F-1000-large-number")).toBe(1000);
    expect(parseFeatureNumber("not-a-feature")).toBeNull();
    expect(formatFeatureNumber(12)).toBe("F-012");
    expect(formatFeatureNumber(1000)).toBe("F-1000");
  });
});
