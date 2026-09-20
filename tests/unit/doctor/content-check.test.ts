import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { checkContent } from "../../../src/core/doctor/checks/content-check.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

describe("doctor content checks", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function writePrd(rootDir: string, purpose: string, inScope: string): Promise<void> {
    const featureDir = path.join(rootDir, "docs/40-features/F-001-example");
    await mkdir(featureDir, { recursive: true });
    await writeFile(
      path.join(featureDir, "PRD.md"),
      `# PRD: Example\n\n## Purpose\n\n${purpose}\n\n## In Scope\n\n${inScope}\n`,
      "utf8",
    );
  }

  async function writeModule(rootDir: string, purpose: string, owns: string): Promise<void> {
    const moduleDir = path.join(rootDir, "docs/30-modules/blog-store");
    await mkdir(moduleDir, { recursive: true });
    await writeFile(
      path.join(moduleDir, "MODULE.md"),
      `# Module: Blog Store\n\n## Purpose\n\n${purpose}\n\n## Owns\n\n${owns}\n`,
      "utf8",
    );
  }

  async function writeSecurityDocs(rootDir: string, auth: string, assets: string): Promise<void> {
    const dir = path.join(rootDir, "docs/20-security");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "SECURITY_MODEL.md"),
      `# Security Model\n\n## Authentication And Authorization\n\n${auth}\n`,
      "utf8",
    );
    await writeFile(
      path.join(dir, "THREAT_MODEL.md"),
      `# Threat Model\n\n## Assets\n\n${assets}\n`,
      "utf8",
    );
  }

  async function writeAcceptedAdr(rootDir: string): Promise<void> {
    const dir = path.join(rootDir, "docs/adrs");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "ADR-0001-example.md"),
      "# ADR-0001\n\n## Status\n\nAccepted\n",
      "utf8",
    );
  }

  const UNFILLED_AUTH =
    "Describe how this repository authenticates users or clients and how it authorizes actions.";
  const UNFILLED_ASSETS =
    "Describe what this repository must protect: user data, credentials, money, availability, or reputation.";

  async function writeProduct(rootDir: string, purpose: string, users: string): Promise<void> {
    const dir = path.join(rootDir, "docs/00-product");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "PRODUCT.md"),
      `# Product\n\n## Purpose\n\n${purpose}\n\n## Users\n\n${users}\n`,
      "utf8",
    );
  }

  it("does not flag unfilled security docs on a bare scaffold (no work yet)", async () => {
    const rootDir = await createRoot("content-security-bare");
    await writeSecurityDocs(rootDir, UNFILLED_AUTH, UNFILLED_ASSETS);

    const { findings } = await checkContent({ rootDir, config: createDefaultConfig() });

    expect(findings).toEqual([]);
  });

  it("forces unfilled security docs once the repository has work", async () => {
    const rootDir = await createRoot("content-security-work");
    await writeSecurityDocs(rootDir, UNFILLED_AUTH, UNFILLED_ASSETS);
    await writeAcceptedAdr(rootDir);

    const { findings } = await checkContent({ rootDir, config: createDefaultConfig() });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "content-security",
      }),
    );
    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "content-threat-model",
        message: "Threat model assets section is still an unfilled template.",
      }),
    );
  });

  it("does not flag filled security docs even when work exists", async () => {
    const rootDir = await createRoot("content-security-filled");
    await writeSecurityDocs(
      rootDir,
      "Users authenticate with Sanctum cookies; controllers authorize via Policies.",
      "User PII, payment tokens, and admin session integrity.",
    );
    await writeAcceptedAdr(rootDir);

    const { findings } = await checkContent({ rootDir, config: createDefaultConfig() });

    expect(findings).toEqual([]);
  });

  it("warns when module memory is still the unfilled template", async () => {
    const rootDir = await createRoot("content-module-unfilled");
    await writeModule(rootDir, "Describe what this module owns and why it exists.", "- TBD");

    const { findings } = await checkContent({ rootDir, config: createDefaultConfig() });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "content-module",
        message: "Module memory purpose is still an unfilled template.",
      }),
    );
    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "content-module",
        message: "Module memory owns section is still an unfilled template.",
      }),
    );
  });

  it("produces no finding for filled module memory", async () => {
    const rootDir = await createRoot("content-module-filled");
    await writeModule(
      rootDir,
      "Owns durable persistence and the typed data-access boundary for the blog.",
      "- The SQLite schema and the typed repository.",
    );

    const { findings } = await checkContent({ rootDir, config: createDefaultConfig() });

    expect(findings).toEqual([]);
  });

  it("warns when a feature PRD is still the unfilled template", async () => {
    const rootDir = await createRoot("content-unfilled");
    await writePrd(
      rootDir,
      "Describe why this feature exists and what user or business problem it solves.",
      "- TBD",
    );

    const { findings } = await checkContent({ rootDir, config: createDefaultConfig() });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "content-feature-prd",
        message: "Feature PRD purpose is still an unfilled template.",
      }),
    );
    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        message: "Feature PRD in-scope section is still an unfilled template.",
      }),
    );
  });

  it("produces no findings for a filled PRD", async () => {
    const rootDir = await createRoot("content-filled");
    await writePrd(
      rootDir,
      "This feature adds rate limiting to protect the API from abuse.",
      "- Token-bucket limiter on the public API.",
    );

    const { findings } = await checkContent({ rootDir, config: createDefaultConfig() });

    expect(findings).toEqual([]);
  });

  it("warns when PRODUCT is still the unfilled template", async () => {
    const rootDir = await createRoot("content-product-unfilled");
    await writeProduct(
      rootDir,
      "Describe what this repository is building and why.",
      "Describe who this is for and what success looks like for them.",
    );
    await writeAcceptedAdr(rootDir);

    const { findings, outcome } = await checkContent({ rootDir, config: createDefaultConfig() });

    expect(outcome).toEqual({ id: "content", status: "evaluated" });
    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "content-product",
        message: "Product purpose is still an unfilled template.",
        path: "docs/00-product/PRODUCT.md",
      }),
    );
    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "content-product",
        message: "Product users section is still an unfilled template.",
      }),
    );
  });

  it("produces no findings for a filled PRODUCT", async () => {
    const rootDir = await createRoot("content-product-filled");
    await writeProduct(
      rootDir,
      "This repository tracks decisions so agents stop repeating mistakes.",
      "Automation authors who need durable engineering memory.",
    );
    await writeAcceptedAdr(rootDir);

    const { findings, outcome } = await checkContent({ rootDir, config: createDefaultConfig() });

    expect(outcome).toEqual({ id: "content", status: "evaluated" });
    expect(findings).toEqual([]);
  });

  it("reports not-evaluated when no features, modules, or ADRs exist", async () => {
    const rootDir = await createRoot("content-empty");

    const { findings, outcome } = await checkContent({ rootDir, config: createDefaultConfig() });

    expect(findings).toEqual([]);
    expect(outcome).toEqual({
      id: "content",
      status: "not-evaluated",
      reason:
        "no feature folders, module folders, or ADRs exist, so there is no memory content to check",
    });
  });
});
