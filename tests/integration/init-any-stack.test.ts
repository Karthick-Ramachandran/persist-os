import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { PersistConfig } from "../../src/core/config/config-schema.js";
import {
  createTempRoot,
  readGeneratedJson,
  removeTempRoot,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

/**
 * One fixture per supported stack (minimal manifest files only, no real installs): the exact
 * `testCommand` and `prePushGates` written by `init --yes`, and the init output line. This is
 * the fixture table from the 1.5.0 brief, executable.
 */
describe("init detects any stack", () => {
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
    const full = path.join(rootDir, name);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, "utf8");
  }

  function testGateLine(stdout: string): string {
    const line = stdout.split("\n").find((candidate) => candidate.startsWith("Test gate:"));
    if (line === undefined) {
      throw new Error("init printed no Test gate line");
    }
    return line;
  }

  async function initAndRead(rootDir: string): Promise<{
    config: PersistConfig;
    gateLine: string;
  }> {
    const result = await runInitCommand(rootDir, ["--yes"]);
    expect(result.exitCode).toBe(0);
    return {
      config: await readGeneratedJson<PersistConfig>(rootDir, ".persist/config.json"),
      gateLine: testGateLine(result.stdout),
    };
  }

  it("Laravel: php artisan test with Pint and PHPStan gates", async () => {
    const rootDir = await createRoot("any-laravel");
    await writeJson(rootDir, "composer.json", {
      require: { "laravel/framework": "^11.0", "laravel/pint": "^1.0" },
    });
    await writeText(rootDir, "artisan", "#!/usr/bin/env php\n");
    await writeText(rootDir, "phpstan.neon", "parameters:\n\tlevel: 5\n");

    const { config, gateLine } = await initAndRead(rootDir);

    expect(config.testCommand).toBe("php artisan test");
    expect(config.prePushGates).toEqual(["vendor/bin/pint --test", "vendor/bin/phpstan analyse"]);
    expect(gateLine).toBe(
      "Test gate: php artisan test (saved as testCommand in .persist/config.json).",
    );
  });

  it("Laravel with Vite: composer wins and the npm script is named", async () => {
    const rootDir = await createRoot("any-laravel-vite");
    await writeJson(rootDir, "composer.json", {
      require: { "laravel/framework": "^11.0", "laravel/pint": "^1.0" },
    });
    await writeText(rootDir, "artisan", "#!/usr/bin/env php\n");
    await writeText(rootDir, "phpstan.neon", "parameters:\n\tlevel: 5\n");
    await writeJson(rootDir, "package.json", {
      scripts: { test: "vite build", build: "vite build" },
    });

    const { config, gateLine } = await initAndRead(rootDir);

    expect(config.testCommand).toBe("php artisan test");
    expect(config.prePushGates).toEqual(["vendor/bin/pint --test", "vendor/bin/phpstan analyse"]);
    expect(gateLine).toBe(
      "Test gate: php artisan test (also found: npm run test in package.json) " +
        "(saved as testCommand in .persist/config.json).",
    );
  });

  it("Symfony with PHPUnit: vendor/bin/phpunit, no push gates", async () => {
    const rootDir = await createRoot("any-symfony");
    await writeJson(rootDir, "composer.json", {
      require: { "symfony/framework-bundle": "^7.0" },
      "require-dev": { "phpunit/phpunit": "^11.0" },
    });
    await writeText(rootDir, "phpunit.xml.dist", "<phpunit/>\n");

    const { config, gateLine } = await initAndRead(rootDir);

    expect(config.testCommand).toBe("vendor/bin/phpunit");
    expect(config.prePushGates).toEqual([]);
    expect(gateLine).toBe(
      "Test gate: vendor/bin/phpunit (saved as testCommand in .persist/config.json).",
    );
  });

  it("Django with pytest and uv.lock: uv run pytest", async () => {
    const rootDir = await createRoot("any-django-pytest");
    await writeText(rootDir, "manage.py", "#!/usr/bin/env python\n");
    await writeText(
      rootDir,
      "pyproject.toml",
      "[project]\ndependencies = ['django', 'pytest']\n\n[tool.pytest.ini_options]\ntestpaths = ['tests']\n",
    );
    await writeText(rootDir, "uv.lock", "");

    const { config, gateLine } = await initAndRead(rootDir);

    expect(config.testCommand).toBe("uv run pytest");
    expect(config.prePushGates).toEqual([]);
    expect(gateLine).toBe(
      "Test gate: uv run pytest (saved as testCommand in .persist/config.json).",
    );
  });

  it("Django without pytest: python manage.py test", async () => {
    const rootDir = await createRoot("any-django");
    await writeText(rootDir, "manage.py", "#!/usr/bin/env python\n");
    await writeText(rootDir, "requirements.txt", "django==5.0\n");

    const { config, gateLine } = await initAndRead(rootDir);

    expect(config.testCommand).toBe("python manage.py test");
    expect(config.prePushGates).toEqual([]);
    expect(gateLine).toBe(
      "Test gate: python manage.py test (saved as testCommand in .persist/config.json).",
    );
  });

  it("Go module: go test with a vet gate", async () => {
    const rootDir = await createRoot("any-go");
    await writeText(rootDir, "go.mod", "module example.com/x\n\ngo 1.22\n");

    const { config, gateLine } = await initAndRead(rootDir);

    expect(config.testCommand).toBe("go test ./...");
    expect(config.prePushGates).toEqual(["go vet ./..."]);
    expect(gateLine).toBe(
      "Test gate: go test ./... (saved as testCommand in .persist/config.json).",
    );
  });

  it("Rust crate without clippy.toml: cargo test, no push gates", async () => {
    const rootDir = await createRoot("any-rust");
    await writeText(rootDir, "Cargo.toml", '[package]\nname = "x"\nversion = "0.1.0"\n');

    const { config, gateLine } = await initAndRead(rootDir);

    expect(config.testCommand).toBe("cargo test");
    expect(config.prePushGates).toEqual([]);
    expect(gateLine).toBe("Test gate: cargo test (saved as testCommand in .persist/config.json).");
  });

  it("Rust crate with clippy.toml: cargo test with the clippy gate", async () => {
    const rootDir = await createRoot("any-rust-clippy");
    await writeText(rootDir, "Cargo.toml", '[package]\nname = "x"\nversion = "0.1.0"\n');
    await writeText(rootDir, "clippy.toml", "");

    const { config, gateLine } = await initAndRead(rootDir);

    expect(config.testCommand).toBe("cargo test");
    expect(config.prePushGates).toEqual(["cargo clippy -- -D warnings"]);
    expect(gateLine).toBe("Test gate: cargo test (saved as testCommand in .persist/config.json).");
  });

  it("Rails with RSpec: bundle exec rspec with the rubocop gate", async () => {
    const rootDir = await createRoot("any-rails");
    await writeText(
      rootDir,
      "Gemfile",
      'source "https://rubygems.org"\n\ngem "rails"\ngem "rspec-rails"\n',
    );
    await writeText(rootDir, ".rubocop.yml", "AllCops:\n");

    const { config, gateLine } = await initAndRead(rootDir);

    expect(config.testCommand).toBe("bundle exec rspec");
    expect(config.prePushGates).toEqual(["bundle exec rubocop"]);
    expect(gateLine).toBe(
      "Test gate: bundle exec rspec (saved as testCommand in .persist/config.json).",
    );
  });

  it("Makefile-only repo: make test, no push gates", async () => {
    const rootDir = await createRoot("any-make");
    await writeText(rootDir, "Makefile", ".PHONY: test\ntest:\n\tgo test ./...\n");

    const { config, gateLine } = await initAndRead(rootDir);

    expect(config.testCommand).toBe("make test");
    expect(config.prePushGates).toEqual([]);
    expect(gateLine).toBe("Test gate: make test (saved as testCommand in .persist/config.json).");
  });

  it("Next.js repo: today's pnpm detection, unchanged", async () => {
    const rootDir = await createRoot("any-nextjs");
    await writeJson(rootDir, "package.json", {
      dependencies: { next: "15.0.0" },
      scripts: {
        test: "vitest",
        "test:run": "vitest run",
        typecheck: "tsc --noEmit",
        lint: "eslint .",
      },
    });
    await writeText(rootDir, "pnpm-lock.yaml", "");

    const { config, gateLine } = await initAndRead(rootDir);

    expect(config.testCommand).toBe("pnpm run test:run");
    expect(config.prePushGates).toEqual(["pnpm run typecheck", "pnpm run lint"]);
    expect(gateLine).toBe(
      "Test gate: pnpm run test:run (saved as testCommand in .persist/config.json).",
    );
  });

  it("plain npm repo: today's npm detection, unchanged", async () => {
    const rootDir = await createRoot("any-npm");
    await writeJson(rootDir, "package.json", { scripts: { test: "jest" } });

    const { config, gateLine } = await initAndRead(rootDir);

    expect(config.testCommand).toBe("npm run test");
    expect(config.prePushGates).toEqual([]);
    expect(gateLine).toBe(
      "Test gate: npm run test (saved as testCommand in .persist/config.json).",
    );
  });
});
