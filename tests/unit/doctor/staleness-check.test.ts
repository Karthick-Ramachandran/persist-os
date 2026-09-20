import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import {
  checkStaleness,
  isShallowRepository,
} from "../../../src/core/doctor/checks/staleness-check.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

function gitAt(rootDir: string, date: string, ...args: string[]): void {
  execFileSync("git", args, {
    cwd: rootDir,
    stdio: "ignore",
    env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
  });
}

async function write(rootDir: string, relativePath: string, content: string): Promise<void> {
  const full = path.join(rootDir, relativePath);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, content, "utf8");
}

describe("doctor staleness check", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  async function initRepo(rootDir: string): Promise<void> {
    execFileSync("git", ["init"], { cwd: rootDir, stdio: "ignore" });
    execFileSync("git", ["config", "user.email", "t@t"], { cwd: rootDir, stdio: "ignore" });
    execFileSync("git", ["config", "user.name", "t"], { cwd: rootDir, stdio: "ignore" });
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("warns when referenced code changed long after the memory", async () => {
    const rootDir = await createRoot("stale-old");
    await initRepo(rootDir);
    await write(rootDir, "docs/40-features/F-001-x/PRD.md", "# PRD\n\nUses `src/foo.ts`.\n");
    await write(rootDir, "src/foo.ts", "export const a = 1;\n");
    gitAt(rootDir, "2024-01-01T00:00:00", "add", "-A");
    gitAt(rootDir, "2024-01-01T00:00:00", "commit", "-m", "init");

    await write(rootDir, "src/foo.ts", "export const a = 2;\n");
    gitAt(rootDir, "2024-12-01T00:00:00", "add", "src/foo.ts");
    gitAt(rootDir, "2024-12-01T00:00:00", "commit", "-m", "change code months later");

    const { findings, outcome } = await checkStaleness({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(outcome).toEqual({ id: "staleness", status: "evaluated" });
    expect(findings).toContainEqual(
      expect.objectContaining({ severity: "warning", check: "staleness" }),
    );
  });

  it("is quiet when memory and code were committed together", async () => {
    const rootDir = await createRoot("stale-fresh");
    await initRepo(rootDir);
    await write(rootDir, "docs/40-features/F-001-x/PRD.md", "# PRD\n\nUses `src/foo.ts`.\n");
    await write(rootDir, "src/foo.ts", "export const a = 1;\n");
    gitAt(rootDir, "2024-01-01T00:00:00", "add", "-A");
    gitAt(rootDir, "2024-01-01T00:00:00", "commit", "-m", "init together");

    const { findings, outcome } = await checkStaleness({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(outcome).toEqual({ id: "staleness", status: "evaluated" });
    expect(findings).toEqual([]);
  });

  it("detects full history as not shallow", async () => {
    const rootDir = await createRoot("shallow-full");
    await initRepo(rootDir);
    await write(rootDir, "file.txt", "x\n");
    gitAt(rootDir, "2024-01-01T00:00:00", "add", "-A");
    gitAt(rootDir, "2024-01-01T00:00:00", "commit", "-m", "one");
    await write(rootDir, "file.txt", "y\n");
    gitAt(rootDir, "2024-02-01T00:00:00", "add", "-A");
    gitAt(rootDir, "2024-02-01T00:00:00", "commit", "-m", "two");

    await expect(isShallowRepository(rootDir)).resolves.toBe(false);
  });

  it("detects a depth-1 clone as shallow", async () => {
    const source = await createRoot("shallow-source");
    await initRepo(source);
    await write(source, "file.txt", "x\n");
    gitAt(source, "2024-01-01T00:00:00", "add", "-A");
    gitAt(source, "2024-01-01T00:00:00", "commit", "-m", "one");

    const cloneDir = await createTempRoot("shallow-clone");
    roots.push(cloneDir);
    execFileSync("git", ["clone", "--depth", "1", `file://${source}`, cloneDir], {
      stdio: "ignore",
    });

    await expect(isShallowRepository(cloneDir)).resolves.toBe(true);
  });

  it("treats git failure as not shallow rather than crashing", async () => {
    const rootDir = await createRoot("shallow-nogit");

    await expect(isShallowRepository(rootDir)).resolves.toBe(false);
  });

  it("reports not-evaluated with a fetch-depth reason in a shallow clone", async () => {
    const source = await createRoot("shallow-stale-source");
    await initRepo(source);
    await write(source, "docs/40-features/F-001-x/PRD.md", "# PRD\n\nUses `src/foo.ts`.\n");
    await write(source, "src/foo.ts", "export const a = 1;\n");
    gitAt(source, "2024-01-01T00:00:00", "add", "-A");
    gitAt(source, "2024-01-01T00:00:00", "commit", "-m", "one");

    const cloneDir = await createTempRoot("shallow-stale-clone");
    roots.push(cloneDir);
    execFileSync("git", ["clone", "--depth", "1", `file://${source}`, cloneDir], {
      stdio: "ignore",
    });

    const { findings, outcome } = await checkStaleness({
      rootDir: cloneDir,
      config: createDefaultConfig(),
    });

    expect(findings).toEqual([]);
    expect(outcome).toEqual({
      id: "staleness",
      status: "not-evaluated",
      reason:
        "shallow clone (fetch-depth 1): every file reports the same commit time, so staleness cannot be measured — use fetch-depth: 0",
    });
  });

  it("reports not-evaluated with a reason outside a git repository", async () => {
    const rootDir = await createRoot("stale-nogit");
    await write(rootDir, "docs/40-features/F-001-x/PRD.md", "# PRD\n\nUses `src/foo.ts`.\n");
    await write(rootDir, "src/foo.ts", "x\n");

    const { findings, outcome } = await checkStaleness({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toEqual([]);
    expect(outcome).toEqual({
      id: "staleness",
      status: "not-evaluated",
      reason: "not a git repository, so commit history is unavailable",
    });
  });

  it("warns when code cited by an ADR changed long after", async () => {
    const rootDir = await createRoot("stale-adr-old");
    await initRepo(rootDir);
    await write(rootDir, "docs/adrs/ADR-0001-x.md", "# ADR-0001\n\nUses `src/foo.ts`.\n");
    await write(rootDir, "src/foo.ts", "export const a = 1;\n");
    gitAt(rootDir, "2024-01-01T00:00:00", "add", "-A");
    gitAt(rootDir, "2024-01-01T00:00:00", "commit", "-m", "init");

    await write(rootDir, "src/foo.ts", "export const a = 2;\n");
    gitAt(rootDir, "2024-12-01T00:00:00", "add", "src/foo.ts");
    gitAt(rootDir, "2024-12-01T00:00:00", "commit", "-m", "change code months later");

    const { findings, outcome } = await checkStaleness({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(outcome).toEqual({ id: "staleness", status: "evaluated" });
    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "staleness",
        path: "docs/adrs/ADR-0001-x.md",
      }),
    );
  });

  it("is quiet when an ADR and code were committed together", async () => {
    const rootDir = await createRoot("stale-adr-fresh");
    await initRepo(rootDir);
    await write(rootDir, "docs/adrs/ADR-0001-x.md", "# ADR-0001\n\nUses `src/foo.ts`.\n");
    await write(rootDir, "src/foo.ts", "export const a = 1;\n");
    gitAt(rootDir, "2024-01-01T00:00:00", "add", "-A");
    gitAt(rootDir, "2024-01-01T00:00:00", "commit", "-m", "init together");

    const { findings, outcome } = await checkStaleness({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(outcome).toEqual({ id: "staleness", status: "evaluated" });
    expect(findings).toEqual([]);
  });

  it("treats a completed feature's docs as history", async () => {
    const rootDir = await createRoot("stale-history");
    await initRepo(rootDir);
    await write(rootDir, "docs/40-features/F-001-x/PRD.md", "# PRD\n\nBuilt `src/foo.ts`.\n");
    await write(rootDir, "docs/40-features/F-001-x/COMPLETION_REPORT.md", "# Done\n");
    await write(rootDir, "src/foo.ts", "export const a = 1;\n");
    gitAt(rootDir, "2024-01-01T00:00:00", "add", "-A");
    gitAt(rootDir, "2024-01-01T00:00:00", "commit", "-m", "init");

    await write(rootDir, "src/foo.ts", "export const a = 2;\n");
    gitAt(rootDir, "2024-12-01T00:00:00", "add", "src/foo.ts");
    gitAt(rootDir, "2024-12-01T00:00:00", "commit", "-m", "change code months later");

    const { findings, outcome } = await checkStaleness({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(outcome).toEqual({ id: "staleness", status: "evaluated" });
    expect(findings).toEqual([]);
  });

  it("still flags an in-progress feature's docs", async () => {
    const rootDir = await createRoot("stale-inprogress");
    await initRepo(rootDir);
    await write(rootDir, "docs/40-features/F-001-x/PRD.md", "# PRD\n\nBuilds `src/foo.ts`.\n");
    await write(rootDir, "src/foo.ts", "export const a = 1;\n");
    gitAt(rootDir, "2024-01-01T00:00:00", "add", "-A");
    gitAt(rootDir, "2024-01-01T00:00:00", "commit", "-m", "init");

    await write(rootDir, "src/foo.ts", "export const a = 2;\n");
    gitAt(rootDir, "2024-12-01T00:00:00", "add", "src/foo.ts");
    gitAt(rootDir, "2024-12-01T00:00:00", "commit", "-m", "change code months later");

    const { findings } = await checkStaleness({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "staleness",
        path: "docs/40-features/F-001-x/PRD.md",
      }),
    );
  });

  it("reports not-evaluated when no feature or module folders exist", async () => {
    const rootDir = await createRoot("stale-nofolders");
    await initRepo(rootDir);

    const { findings, outcome } = await checkStaleness({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toEqual([]);
    expect(outcome).toEqual({
      id: "staleness",
      status: "not-evaluated",
      reason:
        "no ADRs, conventions, feature folders, or module folders exist, so there is no memory to compare against code history",
    });
  });
});
