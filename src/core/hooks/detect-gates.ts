import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
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
 * A proposed test command and where it was detected, so `init` can print what it chose and
 * what else it found. `gates` are the pre-push gates for the winning stack only — the choice
 * stays single-stack and visible instead of unioning every toolchain in the repo.
 */
export type DetectedTestCommand = {
  command: string;
  /** The manifest the command was read from (e.g. `composer.json`, `package.json`). */
  source: string;
};

/** One stack's proposal: the command (null when the stack matches nothing runnable) and gates. */
type StackCandidate = {
  command: string | null;
  source: string;
  gates: string[];
};

/**
 * Every detected test command in precedence order: composer, Python, Go, Rust, Ruby,
 * `package.json`, Makefile. A `package.json` with a usable test script outranks only the
 * Makefile — every other stack wins over it, so a Laravel app with a Vite `package.json`
 * still runs `php artisan test`. Detection only proposes these as editable config values.
 */
export async function detectTestCommands(rootDir: string): Promise<DetectedTestCommand[]> {
  const stacks = await detectStacks(rootDir);
  return stacks.flatMap((stack) =>
    stack.command === null ? [] : [{ command: stack.command, source: stack.source }],
  );
}

/** Every matching stack in precedence order, including gate-only proposals. */
async function detectStacks(rootDir: string): Promise<StackCandidate[]> {
  const candidates = await Promise.all([
    detectComposer(rootDir),
    detectPython(rootDir),
    detectGo(rootDir),
    detectRust(rootDir),
    detectRuby(rootDir),
    detectJavaScript(rootDir),
    detectMakefile(rootDir),
  ]);

  return candidates.filter((candidate) => candidate !== null);
}

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
 *
 * On non-JavaScript stacks the first matching stack wins (composer, Python, Go, Rust, Ruby,
 * then `package.json`, then Makefile). A JavaScript-only repository resolves exactly as before.
 */
export async function detectTestCommand(rootDir: string): Promise<string | null> {
  const stacks = await detectStacks(rootDir);
  // First runnable command: a gate-only proposal (a `package.json` with lint but no test
  // script) never blocks a runnable command further down, such as a Makefile fallback.
  return stacks.find((stack) => stack.command !== null)?.command ?? null;
}

/**
 * Detect proposed pre-push gates: typecheck and lint, in run order. The test command itself is
 * not included — the pre-push hook runs it via `persist test-gate` (see ADR-0009: pre-push runs
 * testCommand, typecheck, lint exactly once each). Empty when no JavaScript toolchain is detected.
 *
 * On non-JavaScript stacks these are the winning stack's gates (Pint/PHPStan, Ruff/Mypy,
 * `go vet`, Clippy, RuboCop), only when the tool is clearly set up.
 */
export async function detectPrePushGates(rootDir: string): Promise<string[]> {
  const stacks = await detectStacks(rootDir);
  return stacks[0]?.gates ?? [];
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

/** Composer packages consulted by name; `require` and `require-dev` both count as required. */
const COMPOSER_KNOWN_PACKAGES = [
  "laravel/framework",
  "laravel/pint",
  "pestphp/pest",
  "phpunit/phpunit",
] as const;

/**
 * Composer stack, first matching rule wins: an explicit one-shot `composer test` script, then
 * Laravel (`php artisan test`), Pest, PHPUnit. A watch-mode `test` script is rejected like its
 * npm counterpart and falls through to the framework rules. Push gates (Pint, PHPStan) apply to
 * the framework rules only when the tool is clearly set up, never to a custom script.
 */
async function detectComposer(rootDir: string): Promise<StackCandidate | null> {
  const manifest = await readComposerManifest(rootDir);
  if (manifest === null) {
    return null;
  }

  if (manifest.scriptsTest !== null && !isWatchCommand(manifest.scriptsTest)) {
    return { command: "composer test", source: "composer.json", gates: [] };
  }

  const gates = await detectPhpGates(rootDir, manifest.requires);

  if (manifest.requires.has("laravel/framework") && existsSync(path.join(rootDir, "artisan"))) {
    return { command: "php artisan test", source: "composer.json", gates };
  }
  if (manifest.requires.has("pestphp/pest")) {
    return { command: "vendor/bin/pest", source: "composer.json", gates };
  }
  if (manifest.requires.has("phpunit/phpunit")) {
    return { command: "vendor/bin/phpunit", source: "composer.json", gates };
  }

  return null;
}

async function detectPhpGates(rootDir: string, requires: Set<string>): Promise<string[]> {
  const gates: string[] = [];
  if (requires.has("laravel/pint")) {
    gates.push("vendor/bin/pint --test");
  }
  if (
    existsSync(path.join(rootDir, "phpstan.neon")) ||
    existsSync(path.join(rootDir, "phpstan.neon.dist"))
  ) {
    gates.push("vendor/bin/phpstan analyse");
  }
  return gates;
}

type ComposerManifest = {
  scriptsTest: string | null;
  requires: Set<string>;
};

async function readComposerManifest(rootDir: string): Promise<ComposerManifest | null> {
  const raw = await readTextFile(rootDir, "composer.json");
  if (raw === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return { scriptsTest: null, requires: scanComposerPackages(raw) };
    }
    const scripts = isRecord(parsed.scripts) ? parsed.scripts : {};
    const test = scripts["test"];
    let scriptsTest: string | null = null;
    if (typeof test === "string") {
      scriptsTest = test;
    } else if (Array.isArray(test) && test.every((entry) => typeof entry === "string")) {
      scriptsTest = test.join(" && ");
    }
    const requires = new Set<string>();
    for (const table of [parsed["require"], parsed["require-dev"]]) {
      if (isRecord(table)) {
        for (const name of Object.keys(table)) {
          requires.add(name.toLowerCase());
        }
      }
    }
    return { scriptsTest, requires };
  } catch {
    return { scriptsTest: null, requires: scanComposerPackages(raw) };
  }
}

/** A manifest that fails to parse still deserves its best-effort signal, still proposed. */
function scanComposerPackages(raw: string): Set<string> {
  const lowered = raw.toLowerCase();
  return new Set(COMPOSER_KNOWN_PACKAGES.filter((name) => lowered.includes(name)));
}

/**
 * Python stack: pytest when any manifest names it (or a `[tool.pytest…]` section exists),
 * otherwise `python manage.py test` for a Django checkout without pytest. The runner is
 * prefixed `uv run` with a `uv.lock` and `poetry run` with a `poetry.lock`. Push gates are
 * `ruff check .` when ruff is configured or listed, and `mypy .` when a mypy config exists.
 */
async function detectPython(rootDir: string): Promise<StackCandidate | null> {
  const pyproject = await readTextFile(rootDir, "pyproject.toml");
  const setupCfg = await readTextFile(rootDir, "setup.cfg");
  const requirements = await readRequirementFiles(rootDir);
  const requirementTexts = requirements.map((entry) => entry.text);
  const combined = [pyproject ?? "", setupCfg ?? "", ...requirementTexts].join("\n").toLowerCase();

  const hasPytestSection = pyproject !== null && /^\s*\[tool\.pytest[.\]]/imu.test(pyproject);
  const hasPytest = hasPytestSection || combined.includes("pytest");
  const hasManagePy = existsSync(path.join(rootDir, "manage.py"));

  if (!hasPytest && !hasManagePy) {
    return null;
  }

  const prefix = existsSync(path.join(rootDir, "uv.lock"))
    ? "uv run "
    : existsSync(path.join(rootDir, "poetry.lock"))
      ? "poetry run "
      : "";
  const command = hasPytest ? `${prefix}pytest` : `${prefix}python manage.py test`;
  const pytestRequirements = requirements.find((entry) =>
    entry.text.toLowerCase().includes("pytest"),
  );
  const source = hasPytestSection
    ? "pyproject.toml"
    : pytestRequirements !== undefined
      ? pytestRequirements.name
      : setupCfg !== null && setupCfg.toLowerCase().includes("pytest")
        ? "setup.cfg"
        : pyproject !== null
          ? "pyproject.toml"
          : "manage.py";

  return {
    command,
    source,
    gates: await detectPythonGates(rootDir, pyproject, setupCfg, combined),
  };
}

async function detectPythonGates(
  rootDir: string,
  pyproject: string | null,
  setupCfg: string | null,
  combined: string,
): Promise<string[]> {
  const gates: string[] = [];
  const hasRuffSection = pyproject !== null && /^\s*\[tool\.ruff[.\]]/imu.test(pyproject);
  if (
    existsSync(path.join(rootDir, "ruff.toml")) ||
    existsSync(path.join(rootDir, ".ruff.toml")) ||
    hasRuffSection ||
    combined.includes("ruff")
  ) {
    gates.push("ruff check .");
  }
  const hasMypySection =
    (pyproject !== null && /^\s*\[tool\.mypy[.\]]/imu.test(pyproject)) ||
    (setupCfg !== null && /^\s*\[mypy[.\]]/imu.test(setupCfg));
  if (
    existsSync(path.join(rootDir, "mypy.ini")) ||
    existsSync(path.join(rootDir, ".mypy.ini")) ||
    hasMypySection
  ) {
    gates.push("mypy .");
  }
  return gates;
}

/** Top-level `requirements*.txt` files (`requirements.txt`, `requirements-dev.txt`, …). */
async function readRequirementFiles(
  rootDir: string,
): Promise<Array<{ name: string; text: string }>> {
  const names = await listTopLevelFiles(rootDir, /^requirements.*\.txt$/u);
  const entries = await Promise.all(
    names.sort().map(async (name) => ({ name, text: await readTextFile(rootDir, name) })),
  );
  const files: Array<{ name: string; text: string }> = [];
  for (const entry of entries) {
    if (entry.text !== null) {
      files.push({ name: entry.name, text: entry.text });
    }
  }
  return files;
}

/** Go stack: `go test ./...` with `go vet ./...` as the push gate. */
async function detectGo(rootDir: string): Promise<StackCandidate | null> {
  if (!existsSync(path.join(rootDir, "go.mod"))) {
    return null;
  }
  return { command: "go test ./...", source: "go.mod", gates: ["go vet ./..."] };
}

/**
 * Rust stack: `cargo test`, with the Clippy push gate only when Clippy is clearly set up
 * (a `clippy.toml` or `.clippy.toml` exists) — a bare `cargo clippy` on a crate that never
 * configured it is noise, not a gate.
 */
async function detectRust(rootDir: string): Promise<StackCandidate | null> {
  if (!existsSync(path.join(rootDir, "Cargo.toml"))) {
    return null;
  }
  const gates =
    existsSync(path.join(rootDir, "clippy.toml")) || existsSync(path.join(rootDir, ".clippy.toml"))
      ? ["cargo clippy -- -D warnings"]
      : [];
  return { command: "cargo test", source: "Cargo.toml", gates };
}

/**
 * Ruby stack: RSpec when the Gemfile lists `rspec` or `rspec-rails`, otherwise `bin/rails test`
 * for a Rails checkout without RSpec. The RuboCop push gate applies when `.rubocop.yml` exists.
 * Test-only groups still count — unlike framework signals, a test runner belongs in dev groups.
 */
async function detectRuby(rootDir: string): Promise<StackCandidate | null> {
  const gemfile = await readTextFile(rootDir, "Gemfile");
  if (gemfile === null) {
    return null;
  }
  const lowered = gemfile.toLowerCase();
  const command = /\brspec(-rails)?\b/u.test(lowered)
    ? "bundle exec rspec"
    : /\brails\b/u.test(lowered)
      ? "bin/rails test"
      : null;
  if (command === null) {
    return null;
  }
  const gates = existsSync(path.join(rootDir, ".rubocop.yml")) ? ["bundle exec rubocop"] : [];
  return { command, source: "Gemfile", gates };
}

/** Today's `package.json` behaviour, unchanged: a candidate like any other stack. */
async function detectJavaScript(rootDir: string): Promise<StackCandidate | null> {
  const detected = await readScripts(rootDir);

  if (detected === null) {
    return null;
  }

  let command: string | null = null;
  for (const script of ONE_SHOT_TEST_SCRIPTS) {
    if (typeof detected.scripts[script] === "string") {
      command = `${detected.packageManager} run ${script}`;
    }
  }

  if (command === null) {
    const test = detected.scripts["test"];
    if (typeof test === "string" && !isWatchCommand(test)) {
      command = `${detected.packageManager} run test`;
    }
  }

  const gates: string[] = [];
  for (const script of PUSH_GATE_SCRIPTS) {
    if (typeof detected.scripts[script] === "string") {
      gates.push(`${detected.packageManager} run ${script}`);
    }
  }

  if (command === null && gates.length === 0) {
    return null;
  }

  return { command, source: "package.json", gates };
}

/**
 * Makefile fallback: `make test` when a `Makefile` defines a `test:` target and nothing above
 * matched. Last resort, never a guess — without the target there is no candidate.
 */
async function detectMakefile(rootDir: string): Promise<StackCandidate | null> {
  const makefile = await readTextFile(rootDir, "Makefile");
  if (makefile === null || !/^test\s*:(?![:=])/mu.test(makefile)) {
    return null;
  }
  return { command: "make test", source: "Makefile", gates: [] };
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

async function readTextFile(rootDir: string, relativePath: string): Promise<string | null> {
  try {
    return await readFile(path.join(rootDir, relativePath), "utf8");
  } catch {
    return null;
  }
}

async function listTopLevelFiles(rootDir: string, pattern: RegExp): Promise<string[]> {
  try {
    const entries = await readdir(rootDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && pattern.test(entry.name))
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
