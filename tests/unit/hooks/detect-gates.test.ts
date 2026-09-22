import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  detectPreCommitGates,
  detectPrePushGates,
  detectTestCommand,
  detectTestCommands,
  isWatchCommand,
} from "../../../src/core/hooks/detect-gates.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

describe("detectPreCommitGates", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function writePackageJson(rootDir: string, scripts: Record<string, string>): Promise<void> {
    await mkdir(rootDir, { recursive: true });
    await writeFile(
      path.join(rootDir, "package.json"),
      JSON.stringify({ name: "x", scripts }, null, 2),
      "utf8",
    );
  }

  it("returns an empty list when there is no package.json", async () => {
    const rootDir = await createRoot("detect-no-package");
    expect(await detectPreCommitGates(rootDir)).toEqual([]);
  });

  it("proposes pnpm gates for known scripts when a pnpm lockfile exists", async () => {
    const rootDir = await createRoot("detect-pnpm");
    await writePackageJson(rootDir, { test: "vitest", typecheck: "tsc", build: "tsup" });
    await writeFile(path.join(rootDir, "pnpm-lock.yaml"), "", "utf8");

    expect(await detectPreCommitGates(rootDir)).toEqual(["pnpm run test", "pnpm run typecheck"]);
  });

  it("uses npm when only a package-lock.json exists", async () => {
    const rootDir = await createRoot("detect-npm");
    await writePackageJson(rootDir, { test: "jest", lint: "eslint ." });
    await writeFile(path.join(rootDir, "package-lock.json"), "{}", "utf8");

    expect(await detectPreCommitGates(rootDir)).toEqual(["npm run test", "npm run lint"]);
  });

  it("uses yarn when a yarn.lock exists", async () => {
    const rootDir = await createRoot("detect-yarn");
    await writePackageJson(rootDir, { typecheck: "tsc" });
    await writeFile(path.join(rootDir, "yarn.lock"), "", "utf8");

    expect(await detectPreCommitGates(rootDir)).toEqual(["yarn run typecheck"]);
  });

  it("returns an empty list when package.json has no known scripts", async () => {
    const rootDir = await createRoot("detect-no-scripts");
    await writePackageJson(rootDir, { start: "node ." });

    expect(await detectPreCommitGates(rootDir)).toEqual([]);
  });

  it("returns an empty list when package.json is invalid", async () => {
    const rootDir = await createRoot("detect-bad-json");
    await mkdir(rootDir, { recursive: true });
    await writeFile(path.join(rootDir, "package.json"), "{ not json", "utf8");

    expect(await detectPreCommitGates(rootDir)).toEqual([]);
  });
});

describe("detectTestCommand", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function writePackageJson(rootDir: string, scripts: Record<string, string>): Promise<void> {
    await mkdir(rootDir, { recursive: true });
    await writeFile(
      path.join(rootDir, "package.json"),
      JSON.stringify({ name: "x", scripts }, null, 2),
      "utf8",
    );
  }

  it("prefers test:run over test in a Vitest repository", async () => {
    const rootDir = await createRoot("detect-vitest");
    await writePackageJson(rootDir, { test: "vitest", "test:run": "vitest run" });
    await writeFile(path.join(rootDir, "pnpm-lock.yaml"), "", "utf8");

    expect(await detectTestCommand(rootDir)).toBe("pnpm run test:run");
  });

  it("never selects a bare watch-mode test script", async () => {
    const rootDir = await createRoot("detect-watch");
    await writePackageJson(rootDir, { test: "vitest" });

    expect(await detectTestCommand(rootDir)).toBeNull();
  });

  it("selects test when it is one-shot, as with Jest", async () => {
    const rootDir = await createRoot("detect-jest");
    await writePackageJson(rootDir, { test: "jest" });

    expect(await detectTestCommand(rootDir)).toBe("npm run test");
  });

  it("rejects a test script with a watch flag", async () => {
    const rootDir = await createRoot("detect-jest-watch");
    await writePackageJson(rootDir, { test: "jest --watch" });

    expect(await detectTestCommand(rootDir)).toBeNull();
  });

  it("returns null with no package.json rather than guessing", async () => {
    const rootDir = await createRoot("detect-nopackage");

    expect(await detectTestCommand(rootDir)).toBeNull();
  });

  it("returns null when package.json has neither variant", async () => {
    const rootDir = await createRoot("detect-neither");
    await writePackageJson(rootDir, { start: "node ." });

    expect(await detectTestCommand(rootDir)).toBeNull();
  });
});

describe("detectPrePushGates", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("detects typecheck and lint without repeating the test command", async () => {
    const rootDir = await createRoot("detect-push");
    await mkdir(rootDir, { recursive: true });
    await writeFile(
      path.join(rootDir, "package.json"),
      JSON.stringify(
        {
          name: "x",
          scripts: { test: "vitest", "test:run": "vitest run", typecheck: "tsc", lint: "eslint ." },
        },
        null,
        2,
      ),
      "utf8",
    );
    await writeFile(path.join(rootDir, "pnpm-lock.yaml"), "", "utf8");

    expect(await detectPrePushGates(rootDir)).toEqual(["pnpm run typecheck", "pnpm run lint"]);
  });

  it("returns an empty list with no package.json", async () => {
    const rootDir = await createRoot("detect-push-none");

    expect(await detectPrePushGates(rootDir)).toEqual([]);
  });
});

describe("detectTestCommand on other stacks", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function writeJson(
    rootDir: string,
    name: string,
    value: Record<string, unknown>,
  ): Promise<void> {
    await mkdir(rootDir, { recursive: true });
    await writeFile(path.join(rootDir, name), JSON.stringify(value, null, 2), "utf8");
  }

  async function writeText(rootDir: string, name: string, content: string): Promise<void> {
    await mkdir(rootDir, { recursive: true });
    await writeFile(path.join(rootDir, name), content, "utf8");
  }

  async function laravelRoot(prefix: string): Promise<string> {
    const rootDir = await createRoot(prefix);
    await writeJson(rootDir, "composer.json", {
      require: { "laravel/framework": "^11.0", "laravel/pint": "^1.0" },
    });
    await writeText(rootDir, "artisan", "#!/usr/bin/env php\n");
    await writeText(rootDir, "phpstan.neon", "parameters:\n\tlevel: 5\n");
    return rootDir;
  }

  it("picks composer test for an explicit one-shot composer script", async () => {
    const rootDir = await createRoot("detect-composer-script");
    await writeJson(rootDir, "composer.json", { scripts: { test: "phpunit --colors" } });

    expect(await detectTestCommand(rootDir)).toBe("composer test");
    expect(await detectPrePushGates(rootDir)).toEqual([]);
  });

  it("rejects a watch-mode composer test script without guessing", async () => {
    const rootDir = await createRoot("detect-composer-watch");
    await writeJson(rootDir, "composer.json", { scripts: { test: "phpunit --watch" } });

    expect(await detectTestCommand(rootDir)).toBeNull();
  });

  it("picks php artisan test with Pint and PHPStan gates for Laravel", async () => {
    const rootDir = await laravelRoot("detect-laravel");

    expect(await detectTestCommand(rootDir)).toBe("php artisan test");
    expect(await detectPrePushGates(rootDir)).toEqual([
      "vendor/bin/pint --test",
      "vendor/bin/phpstan analyse",
    ]);
  });

  it("needs the artisan file for the Laravel rule", async () => {
    const rootDir = await createRoot("detect-laravel-no-artisan");
    await writeJson(rootDir, "composer.json", { require: { "laravel/framework": "^11.0" } });

    expect(await detectTestCommand(rootDir)).toBeNull();
  });

  it("picks Pest over PHPUnit when both are required", async () => {
    const rootDir = await createRoot("detect-pest");
    await writeJson(rootDir, "composer.json", {
      require: { "pestphp/pest": "^2.0" },
      "require-dev": { "phpunit/phpunit": "^10.0" },
    });

    expect(await detectTestCommand(rootDir)).toBe("vendor/bin/pest");
  });

  it("picks PHPUnit when only phpunit is required", async () => {
    const rootDir = await createRoot("detect-phpunit");
    await writeJson(rootDir, "composer.json", { "require-dev": { "phpunit/phpunit": "^10.0" } });

    expect(await detectTestCommand(rootDir)).toBe("vendor/bin/phpunit");
    expect(await detectPrePushGates(rootDir)).toEqual([]);
  });

  it("prefers composer over package.json and reports the alternate", async () => {
    const rootDir = await laravelRoot("detect-laravel-vite");
    await writeJson(rootDir, "package.json", { scripts: { test: "vite build" } });

    expect(await detectTestCommand(rootDir)).toBe("php artisan test");
    expect(await detectTestCommands(rootDir)).toEqual([
      { command: "php artisan test", source: "composer.json" },
      { command: "npm run test", source: "package.json" },
    ]);
  });

  it("picks pytest from requirements with ruff and mypy gates", async () => {
    const rootDir = await createRoot("detect-pytest");
    await writeText(rootDir, "requirements.txt", "django==5.0\npytest==8.0\nruff==0.4.0\n");
    await writeText(rootDir, "mypy.ini", "[mypy]\n");

    expect(await detectTestCommand(rootDir)).toBe("pytest");
    expect(await detectPrePushGates(rootDir)).toEqual(["ruff check .", "mypy ."]);
  });

  it("prefixes pytest with uv run when uv.lock exists", async () => {
    const rootDir = await createRoot("detect-pytest-uv");
    await writeText(
      rootDir,
      "pyproject.toml",
      "[tool.pytest.ini_options]\ntestpaths = ['tests']\n",
    );
    await writeText(rootDir, "uv.lock", "");

    expect(await detectTestCommand(rootDir)).toBe("uv run pytest");
  });

  it("prefixes pytest with poetry run when poetry.lock exists", async () => {
    const rootDir = await createRoot("detect-pytest-poetry");
    await writeText(rootDir, "pyproject.toml", "[project]\ndependencies = ['pytest']\n");
    await writeText(rootDir, "poetry.lock", "");

    expect(await detectTestCommand(rootDir)).toBe("poetry run pytest");
  });

  it("picks manage.py test for Django without pytest", async () => {
    const rootDir = await createRoot("detect-django");
    await writeText(rootDir, "manage.py", "#!/usr/bin/env python\n");
    await writeText(rootDir, "requirements.txt", "django==5.0\n");

    expect(await detectTestCommand(rootDir)).toBe("python manage.py test");
    expect(await detectPrePushGates(rootDir)).toEqual([]);
  });

  it("picks go test with a vet gate", async () => {
    const rootDir = await createRoot("detect-go");
    await writeText(rootDir, "go.mod", "module example.com/x\n\ngo 1.22\n");

    expect(await detectTestCommand(rootDir)).toBe("go test ./...");
    expect(await detectPrePushGates(rootDir)).toEqual(["go vet ./..."]);
  });

  it("picks cargo test without the clippy gate unless clippy is configured", async () => {
    const plain = await createRoot("detect-rust-plain");
    await writeText(plain, "Cargo.toml", '[package]\nname = "x"\n');

    expect(await detectTestCommand(plain)).toBe("cargo test");
    expect(await detectPrePushGates(plain)).toEqual([]);

    const clipped = await createRoot("detect-rust-clippy");
    await writeText(clipped, "Cargo.toml", '[package]\nname = "x"\n');
    await writeText(clipped, "clippy.toml", "");

    expect(await detectPrePushGates(clipped)).toEqual(["cargo clippy -- -D warnings"]);
  });

  it("picks rspec with a rubocop gate for Rails with RSpec", async () => {
    const rootDir = await createRoot("detect-rspec");
    await writeText(rootDir, "Gemfile", 'gem "rails"\ngem "rspec-rails"\n');
    await writeText(rootDir, ".rubocop.yml", "AllCops:\n");

    expect(await detectTestCommand(rootDir)).toBe("bundle exec rspec");
    expect(await detectPrePushGates(rootDir)).toEqual(["bundle exec rubocop"]);
  });

  it("picks bin/rails test for Rails without RSpec", async () => {
    const rootDir = await createRoot("detect-rails");
    await writeText(rootDir, "Gemfile", 'gem "rails", "~> 7.0"\n');

    expect(await detectTestCommand(rootDir)).toBe("bin/rails test");
    expect(await detectPrePushGates(rootDir)).toEqual([]);
  });

  it("falls back to make test for a Makefile-only repo", async () => {
    const rootDir = await createRoot("detect-make");
    await writeText(rootDir, "Makefile", ".PHONY: test\ntest:\n\tgo test ./...\n");

    expect(await detectTestCommand(rootDir)).toBe("make test");
    expect(await detectPrePushGates(rootDir)).toEqual([]);
  });

  it("keeps a usable package.json script ahead of the Makefile only", async () => {
    const rootDir = await createRoot("detect-js-make");
    await writeJson(rootDir, "package.json", { scripts: { test: "jest" } });
    await writeText(rootDir, "Makefile", "test:\n\techo hi\n");

    expect(await detectTestCommand(rootDir)).toBe("npm run test");
    expect(await detectTestCommands(rootDir)).toEqual([
      { command: "npm run test", source: "package.json" },
      { command: "make test", source: "Makefile" },
    ]);
  });

  it("ignores a Makefile without a test target", async () => {
    const rootDir = await createRoot("detect-make-none");
    await writeText(rootDir, "Makefile", ".PHONY: build\nbuild:\n\techo hi\n");

    expect(await detectTestCommand(rootDir)).toBeNull();
  });
});

describe("isWatchCommand", () => {
  it("treats bare vitest as watch mode", () => {
    expect(isWatchCommand("vitest")).toBe(true);
  });

  it("treats --watch flags as watch mode", () => {
    expect(isWatchCommand("jest --watch")).toBe(true);
    expect(isWatchCommand("jest --watchAll")).toBe(false);
  });

  it("treats plain runners as one-shot", () => {
    expect(isWatchCommand("jest")).toBe(false);
    expect(isWatchCommand("vitest run")).toBe(false);
    expect(isWatchCommand("pytest")).toBe(false);
  });
});
