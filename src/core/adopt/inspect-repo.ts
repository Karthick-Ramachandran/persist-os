import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { TEST_FILE_PATTERNS } from "../naming/test-files.js";

/**
 * Read-only signals inferred from a repository's manifest and marker files.
 *
 * Inspection never executes repository code, makes network calls, or installs anything. Every signal
 * here is a candidate the user reviews; nothing is accepted by adoption.
 */
export type RepoSignals = {
  languages: string[];
  packageManager: string | null;
  /** The manifest file the package manager was inferred from (e.g. `go.mod`). */
  packageManagerSource: string | null;
  frameworks: string[];
  hasTests: boolean;
  /** Where tests were detected (e.g. a matched `*_test.go` path), so a reviewer can correct it. */
  testsEvidence: string | null;
  hasReadme: boolean;
  hasDocs: boolean;
};

/** Maps a detected framework to the manifest it was inferred from, for reviewable provenance. */
const FRAMEWORK_SOURCES: Record<string, string> = {
  "Next.js": "package.json",
  React: "package.json",
  NestJS: "package.json",
  Express: "package.json",
  FastAPI: "pyproject.toml / requirements.txt",
  Flask: "pyproject.toml / requirements.txt",
  Django: "pyproject.toml / requirements.txt",
  Gin: "go.mod",
  Echo: "go.mod",
  Fiber: "go.mod",
  Chi: "go.mod",
  "Spring Boot": "pom.xml / build.gradle",
  "Actix Web": "Cargo.toml",
  Axum: "Cargo.toml",
  Rocket: "Cargo.toml",
  Laravel: "composer.json",
  Symfony: "composer.json",
  "Ruby on Rails": "Gemfile",
  Flutter: "pubspec.yaml",
};

export async function inspectRepo(rootDir: string): Promise<RepoSignals> {
  const has = (relativePath: string): boolean => existsSync(path.join(rootDir, relativePath));

  const languages = new Set<string>();
  const frameworks = new Set<string>();

  const pkg = has("package.json") ? await readJson(rootDir, "package.json") : null;
  if (pkg !== null) {
    languages.add(has("tsconfig.json") ? "TypeScript" : "JavaScript");
  }

  let pythonText = "";
  if (has("pyproject.toml")) {
    languages.add("Python");
    pythonText += await readText(rootDir, "pyproject.toml");
  }
  if (has("requirements.txt")) {
    languages.add("Python");
    pythonText += await readText(rootDir, "requirements.txt");
  }

  if (has("go.mod")) {
    languages.add("Go");
  }
  if (has("Cargo.toml")) {
    languages.add("Rust");
  }
  if (has("pom.xml") || has("build.gradle") || has("build.gradle.kts")) {
    languages.add("JVM");
  }
  if (has("Package.swift")) {
    languages.add("Swift");
  }
  if (has("pubspec.yaml")) {
    languages.add("Dart");
    frameworks.add("Flutter");
  }

  if (has("composer.json")) {
    languages.add("PHP");
    const composer = (await readText(rootDir, "composer.json")).toLowerCase();
    if (composer.includes("laravel/framework")) {
      frameworks.add("Laravel");
    } else if (composer.includes("symfony/")) {
      frameworks.add("Symfony");
    }
  }

  if (has("Gemfile")) {
    languages.add("Ruby");
    const gemfile = (await readText(rootDir, "Gemfile")).toLowerCase();
    if (gemfile.includes("rails")) {
      frameworks.add("Ruby on Rails");
    }
  }

  const deps = collectDependencies(pkg);
  if ("next" in deps) {
    frameworks.add("Next.js");
  } else if ("react" in deps) {
    frameworks.add("React");
  }
  if ("@nestjs/core" in deps) {
    frameworks.add("NestJS");
  } else if ("express" in deps) {
    frameworks.add("Express");
  }

  const python = pythonText.toLowerCase();
  if (python.includes("fastapi")) {
    frameworks.add("FastAPI");
  } else if (python.includes("flask")) {
    frameworks.add("Flask");
  } else if (python.includes("django")) {
    frameworks.add("Django");
  }

  if (has("go.mod")) {
    const goModules = `${await readText(rootDir, "go.mod")}${await readText(rootDir, "go.sum")}`;
    if (goModules.includes("gin-gonic/gin")) {
      frameworks.add("Gin");
    } else if (goModules.includes("labstack/echo")) {
      frameworks.add("Echo");
    } else if (goModules.includes("gofiber/fiber")) {
      frameworks.add("Fiber");
    } else if (goModules.includes("go-chi/chi")) {
      frameworks.add("Chi");
    }
  }

  const jvmManifest =
    `${await readText(rootDir, "pom.xml")}${await readText(rootDir, "build.gradle")}${await readText(rootDir, "build.gradle.kts")}`.toLowerCase();
  if (jvmManifest.includes("spring-boot") || jvmManifest.includes("springframework")) {
    frameworks.add("Spring Boot");
  }

  if (has("Cargo.toml")) {
    const cargo = (await readText(rootDir, "Cargo.toml")).toLowerCase();
    if (cargo.includes("actix-web")) {
      frameworks.add("Actix Web");
    } else if (cargo.includes("axum")) {
      frameworks.add("Axum");
    } else if (cargo.includes("rocket")) {
      frameworks.add("Rocket");
    }
  }

  const [packageManager, packageManagerSource] = detectPackageManager(has);

  const scripts = pkg !== null && isRecord(pkg.scripts) ? pkg.scripts : {};
  const testsEvidence = await detectTestsEvidence(rootDir, has, "test" in scripts, python);

  return {
    languages: [...languages],
    packageManager,
    packageManagerSource,
    frameworks: [...frameworks],
    hasTests: testsEvidence !== null,
    testsEvidence,
    hasReadme: has("README.md") || has("README"),
    hasDocs: has("docs"),
  };
}

/**
 * Human-readable summary of the inferred signals, with the source each was read from so a reviewer
 * can confirm or correct it. Shared by `recall adopt` (which persists it) and `recall init` (which
 * surfaces it). Every line is proposed, never accepted.
 */
export function summarizeSignals(signals: RepoSignals): string[] {
  const lines: string[] = [];

  lines.push(`- Languages: ${formatList(signals.languages)}`);

  lines.push(
    signals.packageManager === null
      ? "- Package manager: none detected"
      : `- Package manager: ${signals.packageManager}${
          signals.packageManagerSource === null ? "" : ` (from \`${signals.packageManagerSource}\`)`
        }`,
  );

  if (signals.frameworks.length === 0) {
    lines.push("- Frameworks: none detected");
  } else {
    const withSource = signals.frameworks.map((framework) => {
      const source = FRAMEWORK_SOURCES[framework];
      return source === undefined ? framework : `${framework} (from \`${source}\`)`;
    });
    lines.push(`- Frameworks: ${withSource.join(", ")}`);
  }

  lines.push(
    signals.testsEvidence === null
      ? "- Tests: none detected — if tests exist, point Recall at them by correcting this report"
      : `- Tests: detected via ${signals.testsEvidence}`,
  );

  lines.push(`- README present: ${signals.hasReadme ? "yes" : "no"}`);
  lines.push(`- Docs folder present: ${signals.hasDocs ? "yes" : "no"}`);

  return lines;
}

function formatList(values: string[]): string {
  return values.length === 0 ? "none detected" : values.join(", ");
}

/**
 * Choose the repository's primary package manager. A backend manifest (Go, Rust, JVM, PHP, Ruby,
 * Python, Swift, Dart) wins over a JavaScript one, because a lone `package.json` in such a repo is
 * usually tooling (linters, git hooks) rather than the project's real package manager.
 */
function detectPackageManager(
  has: (relativePath: string) => boolean,
): [string | null, string | null] {
  const candidates: Array<[boolean, string, string]> = [
    [has("go.mod"), "Go modules", "go.mod"],
    [has("Cargo.toml"), "Cargo", "Cargo.toml"],
    [has("pom.xml"), "Maven", "pom.xml"],
    [has("build.gradle"), "Gradle", "build.gradle"],
    [has("build.gradle.kts"), "Gradle", "build.gradle.kts"],
    [has("composer.json"), "Composer", "composer.json"],
    [has("Gemfile"), "Bundler", "Gemfile"],
    [has("Package.swift"), "Swift Package Manager", "Package.swift"],
    [has("pubspec.yaml"), "pub", "pubspec.yaml"],
    [has("uv.lock"), "uv", "uv.lock"],
    [has("poetry.lock"), "Poetry", "poetry.lock"],
    [has("requirements.txt"), "pip", "requirements.txt"],
    [has("pyproject.toml"), "pip", "pyproject.toml"],
    [has("pnpm-lock.yaml"), "pnpm", "pnpm-lock.yaml"],
    [has("yarn.lock"), "yarn", "yarn.lock"],
    [has("package-lock.json"), "npm", "package-lock.json"],
    [has("package.json"), "npm", "package.json"],
  ];

  for (const [present, name, source] of candidates) {
    if (present) {
      return [name, source];
    }
  }

  return [null, null];
}

async function detectTestsEvidence(
  rootDir: string,
  has: (relativePath: string) => boolean,
  hasTestScript: boolean,
  pythonText: string,
): Promise<string | null> {
  if (has("tests")) {
    return "`tests/` directory";
  }
  if (has("test")) {
    return "`test/` directory";
  }
  if (has("__tests__")) {
    return "`__tests__/` directory";
  }
  if (has("pytest.ini") || pythonText.includes("pytest")) {
    return "pytest configuration";
  }
  if (has("phpunit.xml") || has("phpunit.xml.dist")) {
    return "PHPUnit configuration";
  }
  if (hasTestScript) {
    return '`"test"` script in package.json';
  }

  const testFile = await findTestFile(rootDir);
  if (testFile !== null) {
    return `\`${testFile}\``;
  }

  return null;
}

const TEST_WALK_SKIP_DIRS = new Set([
  "node_modules",
  "vendor",
  "dist",
  "build",
  "target",
  "coverage",
  "Pods",
  "__pycache__",
]);

/**
 * Bounded, read-only walk that detects test files across ecosystems (Go `*_test.go`, JS/TS
 * `*.test.*`/`*.spec.*`, Python `test_*.py`, JVM `*Test.(java|kt)`, PHP `*Test.php`, Ruby `*_spec.rb`).
 * Capped at a fixed entry budget and skips heavy/vendored directories so it stays fast on large repos.
 */
async function findTestFile(rootDir: string): Promise<string | null> {
  let budget = 4000;
  const stack = [rootDir];

  while (stack.length > 0 && budget > 0) {
    const dir = stack.pop();
    if (dir === undefined) {
      break;
    }

    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      budget -= 1;
      if (budget <= 0) {
        break;
      }

      if (entry.isDirectory()) {
        if (!TEST_WALK_SKIP_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
          stack.push(path.join(dir, entry.name));
        }
      } else if (TEST_FILE_PATTERNS.some((pattern) => pattern.test(entry.name))) {
        return path.relative(rootDir, path.join(dir, entry.name));
      }
    }
  }

  return null;
}

function collectDependencies(pkg: Record<string, unknown> | null): Record<string, unknown> {
  if (pkg === null) {
    return {};
  }

  const dependencies = isRecord(pkg.dependencies) ? pkg.dependencies : {};
  const devDependencies = isRecord(pkg.devDependencies) ? pkg.devDependencies : {};

  return { ...dependencies, ...devDependencies };
}

async function readJson(
  rootDir: string,
  relativePath: string,
): Promise<Record<string, unknown> | null> {
  try {
    const parsed = JSON.parse(await readText(rootDir, relativePath)) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function readText(rootDir: string, relativePath: string): Promise<string> {
  try {
    return await readFile(path.join(rootDir, relativePath), "utf8");
  } catch {
    return "";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
