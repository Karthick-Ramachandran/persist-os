import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { inspectRepo } from "../../../src/core/adopt/inspect-repo.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

describe("inspectRepo", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function write(rootDir: string, relativePath: string, content: string): Promise<void> {
    const full = path.join(rootDir, relativePath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, "utf8");
  }

  it("ignores devDependencies as framework signals", async () => {
    // A library that tests against Express is not an Express app. adopt's report is the first
    // thing a maintainer reads, so a test-only package must not become a proposed decision.
    const rootDir = await createRoot("inspect-devdeps");
    await write(
      rootDir,
      "package.json",
      JSON.stringify({
        name: "some-library",
        dependencies: { "follow-redirects": "^1.15.0" },
        devDependencies: { express: "^4.18.0", next: "^14.0.0", react: "^18.0.0" },
      }),
    );

    const signals = await inspectRepo(rootDir);

    expect(signals.frameworks).toEqual([]);
  });

  it("still detects a framework that is a runtime dependency", async () => {
    const rootDir = await createRoot("inspect-runtime-dep");
    await write(
      rootDir,
      "package.json",
      JSON.stringify({
        name: "some-app",
        dependencies: { express: "^4.18.0" },
        devDependencies: { vitest: "^2.0.0" },
      }),
    );

    const signals = await inspectRepo(rootDir);

    expect(signals.frameworks).toContain("Express");
  });

  it("detects TypeScript, pnpm, and Next.js", async () => {
    const rootDir = await createRoot("inspect-next");
    await write(
      rootDir,
      "package.json",
      JSON.stringify({ dependencies: { next: "14", react: "18" }, scripts: { test: "vitest" } }),
    );
    await write(rootDir, "tsconfig.json", "{}");
    await write(rootDir, "pnpm-lock.yaml", "");
    await write(rootDir, "README.md", "# x");

    const signals = await inspectRepo(rootDir);

    expect(signals.languages).toContain("TypeScript");
    expect(signals.packageManager).toBe("pnpm");
    expect(signals.frameworks).toContain("Next.js");
    expect(signals.hasTests).toBe(true);
    expect(signals.hasReadme).toBe(true);
  });

  it("detects Python and FastAPI from requirements", async () => {
    const rootDir = await createRoot("inspect-fastapi");
    await write(rootDir, "requirements.txt", "fastapi==0.110\nuvicorn\n");

    const signals = await inspectRepo(rootDir);

    expect(signals.languages).toContain("Python");
    expect(signals.frameworks).toContain("FastAPI");
  });

  it("treats a Go repo as Go modules despite a tooling package.json, and finds *_test.go", async () => {
    const rootDir = await createRoot("inspect-go");
    await write(rootDir, "go.mod", "module example.com/api\n\ngo 1.22\n");
    await write(rootDir, "go.sum", "github.com/gin-gonic/gin v1.9.1 h1:abc\n");
    // A lone tooling package.json must not mislabel a Go repo as npm.
    await write(rootDir, "package.json", JSON.stringify({ devDependencies: { prettier: "3" } }));
    await write(rootDir, "package-lock.json", "{}");
    await write(rootDir, "internal/handler/user_test.go", "package handler\n");

    const signals = await inspectRepo(rootDir);

    expect(signals.languages).toContain("Go");
    expect(signals.frameworks).toContain("Gin");
    expect(signals.packageManager).toBe("Go modules");
    expect(signals.packageManagerSource).toBe("go.mod");
    expect(signals.hasTests).toBe(true);
    expect(signals.testsEvidence).toContain("user_test.go");
  });

  it("detects PHP and Laravel from composer.json", async () => {
    const rootDir = await createRoot("inspect-laravel");
    await write(
      rootDir,
      "composer.json",
      JSON.stringify({ require: { "laravel/framework": "^12.0" } }),
    );

    const signals = await inspectRepo(rootDir);

    expect(signals.languages).toContain("PHP");
    expect(signals.frameworks).toContain("Laravel");
    expect(signals.packageManager).toBe("Composer");
  });

  it("returns empty signals for an empty repository", async () => {
    const rootDir = await createRoot("inspect-empty");

    const signals = await inspectRepo(rootDir);

    expect(signals.languages).toEqual([]);
    expect(signals.packageManager).toBeNull();
    expect(signals.frameworks).toEqual([]);
    expect(signals.hasTests).toBe(false);
    expect(signals.hasReadme).toBe(false);
  });
});
