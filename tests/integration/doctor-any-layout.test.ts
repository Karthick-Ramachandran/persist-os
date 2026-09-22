import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runDoctor } from "../../src/core/doctor/doctor-check.js";
import { createTempRoot, removeTempRoot, runInitCommand } from "../helpers/init-test-helpers.js";

async function write(rootDir: string, relativePath: string, content: string): Promise<void> {
  const full = path.join(rootDir, relativePath);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, content, "utf8");
}

/**
 * A Next.js app keeps its code in `app/` and `components/`, not `src/`. Memory that points at a
 * deleted component used to pass doctor, because only `src/` and `tests/` paths were checked.
 */
describe("doctor follows memory to code in any layout", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function nextApp(): Promise<string> {
    const rootDir = await createTempRoot("doctor-next-layout");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    await write(rootDir, "app/checkout/page.tsx", "export default function Page() {}\n");
    await write(rootDir, "components/ui/Button.tsx", "export function Button() {}\n");
    const conventions = path.join(rootDir, "docs/60-engineering/CONVENTIONS.md");
    await writeFile(
      conventions,
      `${await readFile(conventions, "utf8")}\n- Buttons are \`components/ui/Button.tsx\`; checkout lives in \`app/checkout/page.tsx\`.\n`,
      "utf8",
    );
    return rootDir;
  }

  it("flags memory that cites a deleted component outside src/", async () => {
    const rootDir = await nextApp();
    const { rm } = await import("node:fs/promises");
    await rm(path.join(rootDir, "components/ui/Button.tsx"));

    const report = await runDoctor(rootDir);

    expect(report.findings).toContainEqual(
      expect.objectContaining({
        check: "drift-code-reference",
        message: "Repository memory references components/ui/Button.tsx, which does not exist.",
      }),
    );
  });

  it("stays quiet while the cited files exist", async () => {
    const rootDir = await nextApp();

    const report = await runDoctor(rootDir);

    expect(report.findings.filter((f) => f.check === "drift-code-reference")).toEqual([]);
  });

  it("checks staleness for code outside src/", async () => {
    const rootDir = await nextApp();
    const git = (...args: string[]) => execFileSync("git", args, { cwd: rootDir, stdio: "ignore" });
    git("init", "-q");
    git("config", "user.email", "t@e.x");
    git("config", "user.name", "T");
    git("add", "-A");
    execFileSync("git", ["commit", "-q", "-m", "memory", "--no-verify"], {
      cwd: rootDir,
      stdio: "ignore",
      env: {
        ...process.env,
        GIT_COMMITTER_DATE: "2020-01-01T00:00:00",
        GIT_AUTHOR_DATE: "2020-01-01T00:00:00",
      },
    });
    await write(rootDir, "app/checkout/page.tsx", "export default function Page() { return 1; }\n");
    git("add", "app/checkout/page.tsx");
    git("commit", "-q", "-m", "code moves on", "--no-verify");

    const report = await runDoctor(rootDir);

    expect(report.findings).toContainEqual(
      expect.objectContaining({
        check: "staleness",
        message: expect.stringContaining("app/checkout/page.tsx"),
      }),
    );
  });
});
