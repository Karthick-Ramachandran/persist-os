import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { checkContent } from "../../../src/core/doctor/checks/content-check.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

describe("doctor content lessons check", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function lessonsRepo(content: string, git = false, withAdr = true): Promise<string> {
    const rootDir = await createTempRoot("content-lessons");
    roots.push(rootDir);
    if (git) {
      execFileSync("git", ["init", "-q"], { cwd: rootDir, stdio: "ignore" });
    }
    await mkdir(path.join(rootDir, "docs/60-engineering"), { recursive: true });
    await writeFile(path.join(rootDir, "docs/60-engineering/LESSONS.md"), content, "utf8");
    // Non-lessons content checks run once the repository has real work; the
    // lessons checks do not need it, so withAdr=false still evaluates them.
    if (withAdr) {
      const adrDir = path.join(rootDir, "docs/adrs");
      await mkdir(adrDir, { recursive: true });
      await writeFile(
        path.join(adrDir, "ADR-0001-example.md"),
        "# ADR-0001\n\n## Status\n\nAccepted\n",
        "utf8",
      );
    }
    return rootDir;
  }

  function config() {
    return { ...createDefaultConfig(), docsDir: "docs" };
  }

  it("warns when Always exceeds 12 bullets", async () => {
    const lines = ["# Lessons", "", "## Always", ""];
    for (let i = 0; i < 13; i += 1) {
      lines.push(`- Always lesson ${i}.`);
    }
    const rootDir = await lessonsRepo(lines.join("\n"));

    const { findings } = await checkContent({ rootDir, config: config() });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "content-lessons",
        message: expect.stringContaining("Always is for the few lessons every task needs"),
      }),
    );
  });

  it("warns when Always exceeds about 1.5 KB", async () => {
    const rootDir = await lessonsRepo(
      ["# Lessons", "", "## Always", "", `- ${"x".repeat(1600)}`, ""].join("\n"),
    );

    const { findings } = await checkContent({ rootDir, config: config() });

    expect(findings).toContainEqual(
      expect.objectContaining({ severity: "warning", check: "content-lessons" }),
    );
  });

  it("infos when a big flat file has no area sections", async () => {
    const lines = ["# Lessons", ""];
    for (let i = 0; i < 21; i += 1) {
      lines.push(`- Flat lesson ${i} about patience.`);
    }
    const rootDir = await lessonsRepo(lines.join("\n"));

    const { findings } = await checkContent({ rootDir, config: config() });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "info",
        check: "content-lessons",
        message: expect.stringContaining("group lessons by area"),
      }),
    );
  });

  it("nudges grouping in a repo with no ADRs, features, or modules", async () => {
    // The lessons checks run whenever LESSONS.md exists — they are not gated
    // on the content check's real-work rule.
    const lines = ["# Lessons", ""];
    for (let i = 0; i < 21; i += 1) {
      lines.push(`- Flat lesson ${i} about patience.`);
    }
    const rootDir = await lessonsRepo(lines.join("\n"), false, false);

    const { findings, outcome } = await checkContent({ rootDir, config: config() });

    expect(outcome.status).toBe("evaluated");
    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "info",
        check: "content-lessons",
        message: expect.stringContaining("group lessons by area"),
      }),
    );
    // Only the lessons nudge rides: no ADR, feature, or security findings.
    expect(
      findings.filter((finding) => finding.check !== "content-lessons"),
      "non-lessons findings",
    ).toEqual([]);
  });

  it("warns when the whole file exceeds about 12 KB", async () => {
    const rootDir = await lessonsRepo(
      ["# Lessons", "", "## Always", "", `- ${"y".repeat(13 * 1024)}`, ""].join("\n"),
    );

    const { findings } = await checkContent({ rootDir, config: config() });

    const messages = findings
      .filter((finding) => finding.check === "content-lessons")
      .map((finding) => finding.message);
    expect(messages.some((message) => message.includes("12 KB"))).toBe(true);
  });

  it("warns for an area whose Applies To matches no repo file", async () => {
    const rootDir = await lessonsRepo(
      [
        "# Lessons",
        "",
        "## Gone area",
        "",
        "Applies To:",
        "- `src/vanished/**`",
        "",
        "- A real lesson about the vanished area.",
        "",
      ].join("\n"),
      true,
    );
    await mkdir(path.join(rootDir, "src/kept"), { recursive: true });
    await writeFile(path.join(rootDir, "src/kept/here.ts"), "export const x = 1;\n", "utf8");
    execFileSync("git", ["add", "-A"], { cwd: rootDir, stdio: "ignore" });

    const { findings } = await checkContent({ rootDir, config: config() });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "content-lessons",
        message: expect.stringContaining('"Gone area"'),
      }),
    );
  });

  it("stays quiet for an area whose Applies To matches a repo file", async () => {
    const rootDir = await lessonsRepo(
      [
        "# Lessons",
        "",
        "## Kept area",
        "",
        "Applies To:",
        "- `src/kept/**`",
        "",
        "- A real lesson about the kept area.",
        "",
      ].join("\n"),
      true,
    );
    await mkdir(path.join(rootDir, "src/kept"), { recursive: true });
    await writeFile(path.join(rootDir, "src/kept/here.ts"), "export const x = 1;\n", "utf8");
    execFileSync("git", ["add", "-A"], { cwd: rootDir, stdio: "ignore" });

    const { findings } = await checkContent({ rootDir, config: config() });

    expect(findings.filter((finding) => finding.check === "content-lessons")).toEqual([]);
  });

  it("stays quiet on the init template", async () => {
    const rootDir = await lessonsRepo(
      [
        "# Lessons",
        "",
        "## Always",
        "",
        "- (example) Replace this line.",
        "",
        "## Example area",
        "",
        "Applies To:",
        "- `src/example/**`",
        "",
        "- (example) What broke here.",
        "",
      ].join("\n"),
      true,
    );

    const { findings } = await checkContent({ rootDir, config: config() });

    expect(findings.filter((finding) => finding.check === "content-lessons")).toEqual([]);
  });
});
