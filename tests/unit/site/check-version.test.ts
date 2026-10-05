import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

const ROOT = path.resolve(new URL("../../../", import.meta.url).pathname);
const CHECKER = path.join(ROOT, "scripts/site/check-version.mjs");

function runChecker(siteDir: string, packageFile: string): { exitCode: number; output: string } {
  try {
    const output = execFileSync("node", [CHECKER, siteDir, packageFile], { encoding: "utf8" });
    return { exitCode: 0, output };
  } catch (error) {
    const failed = error as { status?: number; stdout?: string; stderr?: string };
    return {
      exitCode: failed.status ?? 1,
      output: `${failed.stdout ?? ""}${failed.stderr ?? ""}`,
    };
  }
}

async function stageSite(
  badgeHtml: string,
  version: string,
): Promise<{
  siteDir: string;
  packageFile: string;
}> {
  const rootDir = await createTempRoot("check-version");
  const siteDir = path.join(rootDir, "site");
  await mkdir(siteDir, { recursive: true });
  await writeFile(
    path.join(siteDir, "index.html"),
    `<footer><span class="footer-local">${badgeHtml} · MIT licensed</span></footer>\n`,
    "utf8",
  );
  const packageFile = path.join(rootDir, "package.json");
  await writeFile(packageFile, JSON.stringify({ version }), "utf8");
  return { siteDir, packageFile };
}

describe("site version checker", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function staged(badgeHtml: string, version: string) {
    const { siteDir, packageFile } = await stageSite(badgeHtml, version);
    roots.push(path.dirname(siteDir));
    return runChecker(siteDir, packageFile);
  }

  it("passes when the badge matches package.json", () => {
    const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8")) as {
      version: string;
    };
    const siteDir = path.join(ROOT, "site");
    const { exitCode, output } = runChecker(siteDir, path.join(ROOT, "package.json"));

    expect(exitCode).toBe(0);
    expect(output).toContain(`v${pkg.version}`);
  });

  it("fails with both versions when the badge is stale", async () => {
    const { exitCode, output } = await staged(`<span class="version-badge">v1.5.0</span>`, "1.8.1");

    expect(exitCode).toBe(1);
    expect(output).toContain("v1.5.0");
    expect(output).toContain("v1.8.1");
  });

  it("fails when the badge is missing", async () => {
    const { exitCode, output } = await staged(`no badge here`, "1.8.1");

    expect(exitCode).toBe(1);
    expect(output).toMatch(/no .* badge/i);
  });

  it("fails when the badge matches more than once", async () => {
    const { exitCode, output } = await staged(
      `<span class="version-badge">v1.8.1</span><span class="version-badge">v1.8.1</span>`,
      "1.8.1",
    );

    expect(exitCode).toBe(1);
    expect(output).toMatch(/2 version badges/i);
  });

  it("wires all three site checkers into one script and into CI", () => {
    const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    const siteCheck = pkg.scripts["site:check"] ?? "";

    expect(siteCheck).toContain("scripts/site/check-commands.mjs");
    expect(siteCheck).toContain("scripts/site/check-transcripts.mjs");
    expect(siteCheck).toContain("scripts/site/check-version.mjs");

    const ci = readFileSync(path.join(ROOT, ".github/workflows/ci.yml"), "utf8");
    expect(ci).toContain("pnpm site:check");
  });
});
