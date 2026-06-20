import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Read-only signals inferred from a repository's manifest and marker files.
 *
 * Inspection never executes repository code, makes network calls, or installs anything. Every signal
 * here is a candidate the user reviews; nothing is accepted by adoption.
 */
export type RepoSignals = {
  languages: string[];
  packageManager: string | null;
  frameworks: string[];
  hasTests: boolean;
  hasReadme: boolean;
  hasDocs: boolean;
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

  let packageManager: string | null = null;
  if (has("pnpm-lock.yaml")) {
    packageManager = "pnpm";
  } else if (has("yarn.lock")) {
    packageManager = "yarn";
  } else if (has("package-lock.json")) {
    packageManager = "npm";
  }

  const scripts = isRecord(pkg?.scripts) ? pkg!.scripts : {};
  const hasTests =
    "test" in scripts ||
    has("test") ||
    has("tests") ||
    has("__tests__") ||
    has("pytest.ini") ||
    python.includes("pytest");

  return {
    languages: [...languages],
    packageManager,
    frameworks: [...frameworks],
    hasTests,
    hasReadme: has("README.md") || has("README"),
    hasDocs: has("docs"),
  };
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
