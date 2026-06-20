import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Scripts that are reasonable to run as pre-commit gates when a target repository defines them.
 * Detection only proposes these as editable config values; it never encodes them as core truth.
 */
const KNOWN_SCRIPTS = ["test", "typecheck", "lint"] as const;

/**
 * Neutrally detect proposed pre-commit gates for a target repository.
 *
 * Reads `package.json` scripts and the lockfile to suggest `<pm> run <script>` commands. Returns an
 * empty list when no JavaScript toolchain is detected. The result is a proposal the user reviews in
 * `.recall/config.json`; it is not an accepted decision.
 */
export async function detectPreCommitGates(rootDir: string): Promise<string[]> {
  const packageJsonPath = path.join(rootDir, "package.json");

  if (!existsSync(packageJsonPath)) {
    return [];
  }

  let scripts: Record<string, unknown>;
  try {
    const raw = await readFile(packageJsonPath, "utf8");
    const parsed = JSON.parse(raw) as { scripts?: Record<string, unknown> };
    scripts = parsed.scripts ?? {};
  } catch {
    return [];
  }

  if (typeof scripts !== "object" || scripts === null) {
    return [];
  }

  const packageManager = detectPackageManager(rootDir);

  return KNOWN_SCRIPTS.filter((script) => typeof scripts[script] === "string").map(
    (script) => `${packageManager} run ${script}`,
  );
}

function detectPackageManager(rootDir: string): string {
  if (existsSync(path.join(rootDir, "pnpm-lock.yaml"))) {
    return "pnpm";
  }

  if (existsSync(path.join(rootDir, "yarn.lock"))) {
    return "yarn";
  }

  return "npm";
}
