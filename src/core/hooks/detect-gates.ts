import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Scripts that are reasonable to run as pre-commit gates when a target repository defines them.
 * Detection only proposes these as editable config values; it never encodes them as core truth.
 */
const KNOWN_SCRIPTS = ["test", "typecheck", "lint"] as const;

/** One-shot test script names, preferred over the watch-mode `test` script. */
const ONE_SHOT_TEST_SCRIPTS = ["test:run"] as const;

/** Push-time checks after the test command, in run order. */
const PUSH_GATE_SCRIPTS = ["typecheck", "lint"] as const;

/**
 * Neutrally detect proposed pre-commit gates for a target repository.
 *
 * Reads `package.json` scripts and the lockfile to suggest `<pm> run <script>` commands. Returns an
 * empty list when no JavaScript toolchain is detected. The result is a proposal the user reviews in
 * `.persist/config.json`; it is not an accepted decision.
 */
export async function detectPreCommitGates(rootDir: string): Promise<string[]> {
  const detected = await readScripts(rootDir);

  if (detected === null) {
    return [];
  }

  return KNOWN_SCRIPTS.filter((script) => typeof detected.scripts[script] === "string").map(
    (script) => `${detected.packageManager} run ${script}`,
  );
}

/**
 * Detect the one-shot test command for the test gate (`testCommand` in config).
 *
 * Prefers an explicit one-shot variant (`test:run`) over `test`, and never selects a watch-mode
 * runner: in a Vitest repo bare `vitest` watches forever, which would hang a hook. Returns null
 * when there is no `package.json`, no usable script, or only a watch runner — a missing gate that
 * says so beats a wrong gate that hangs. The result is a proposal, stored in config for review.
 */
export async function detectTestCommand(rootDir: string): Promise<string | null> {
  const detected = await readScripts(rootDir);

  if (detected === null) {
    return null;
  }

  for (const script of ONE_SHOT_TEST_SCRIPTS) {
    if (typeof detected.scripts[script] === "string") {
      return `${detected.packageManager} run ${script}`;
    }
  }

  const test = detected.scripts["test"];

  if (typeof test === "string" && !isWatchCommand(test)) {
    return `${detected.packageManager} run test`;
  }

  return null;
}

/**
 * Detect proposed pre-push gates: typecheck and lint, in run order. The test command itself is
 * not included — the pre-push hook runs it via `persist test-gate` (see ADR-0009: pre-push runs
 * testCommand, typecheck, lint exactly once each). Empty when no JavaScript toolchain is detected.
 */
export async function detectPrePushGates(rootDir: string): Promise<string[]> {
  const detected = await readScripts(rootDir);

  if (detected === null) {
    return [];
  }

  const gates: string[] = [];

  for (const script of PUSH_GATE_SCRIPTS) {
    if (typeof detected.scripts[script] === "string") {
      gates.push(`${detected.packageManager} run ${script}`);
    }
  }

  return gates;
}

/**
 * Whether a `test` script value runs in watch mode (hangs waiting for input) rather than running
 * once and exiting. Bare `vitest` watches; `jest` runs once unless `--watch` is passed.
 */
export function isWatchCommand(value: string): boolean {
  const trimmed = value.trim();

  if (/(^|\s)--watch(\s|=|$)/u.test(trimmed)) {
    return true;
  }

  return trimmed === "vitest";
}

type DetectedScripts = {
  scripts: Record<string, unknown>;
  packageManager: string;
};

async function readScripts(rootDir: string): Promise<DetectedScripts | null> {
  const packageJsonPath = path.join(rootDir, "package.json");

  if (!existsSync(packageJsonPath)) {
    return null;
  }

  let scripts: Record<string, unknown>;
  try {
    const raw = await readFile(packageJsonPath, "utf8");
    const parsed = JSON.parse(raw) as { scripts?: Record<string, unknown> };
    scripts = parsed.scripts ?? {};
  } catch {
    return null;
  }

  if (typeof scripts !== "object" || scripts === null) {
    return null;
  }

  return { scripts, packageManager: detectPackageManager(rootDir) };
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
