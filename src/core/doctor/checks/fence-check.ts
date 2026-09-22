import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { fenceFileKey } from "../../fence/generate-fence.js";
import { isTestFile } from "../../naming/test-files.js";
import { NO_UPSTREAM_REASON, readChangeSet } from "../change-set.js";
import type { DoctorCheckContext, DoctorCheckOutcome, DoctorFinding } from "../doctor-check.js";

/** FENCES.md location under the configured docs dir (ADR-0010). Never required, only written. */
const FENCES_FILE = "60-engineering/FENCES.md";

/** A fence section heading: `## `<repo-relative path>`` with an optional symbol suffix. */
const FENCE_HEADING_PATTERN = /^## `([^`]+)`/u;
/** The one-sentence standing reason directly under a fence heading. */
const FENCE_WHY_PATTERN = /^Why:\s*(.+)$/u;

/**
 * Obvious non-logic (ADR-0010): tests, styles, markdown, lockfiles, generated output,
 * configuration. One visible list — a scope set wrong disables the fence silently, so it lives
 * here, documented, not in config. `isTestFile` covers tests; the rest is below.
 */
const STYLE_EXTENSIONS = new Set([".css", ".scss", ".sass", ".less", ".styl"]);
const MARKDOWN_EXTENSIONS = new Set([".md", ".mdc", ".markdown"]);

const LOCKFILE_NAMES = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "Cargo.lock",
  "Gemfile.lock",
  "composer.lock",
  "poetry.lock",
  "Pipfile.lock",
  "go.sum",
]);

const GENERATED_DIR_PREFIXES = [
  // Compiled and bundled output.
  "dist/",
  "build/",
  "coverage/",
  ".next/",
  // Vendored dependencies and compiler output.
  "vendor/",
  "target/",
  // Laravel compiled config, routes, and views; never hand-written logic.
  "bootstrap/cache/",
  // Laravel compiled views, sessions, and framework caches.
  "storage/framework/",
  // Symfony (and friends) application cache.
  "var/cache/",
  // Python bytecode caches, at any depth.
  "__pycache__/",
  // Pytest result caches (also dot-directories; listed so the skip is visible).
  ".pytest_cache/",
  // JavaScript dependencies (also a dot-free top-level folder in every npm repo).
  "node_modules/",
  // Turborepo, SvelteKit, and Nuxt build output (dot-directories; listed for visibility).
  ".turbo/",
  ".svelte-kit/",
  ".nuxt/",
  ".output/",
  // Rails (and Rack) file caches.
  "tmp/cache/",
];
const GENERATED_FILE_SUFFIXES = [".min.js", ".js.map", ".css.map"];

const CONFIG_FILE_PATTERN =
  /(^|\/)(\.env(\..*)?|package\.json|package-lock\.json|tsconfig(\..*)?\.json|jsconfig\.json|[^/]*\.config\.[^/]*)$/u;

export type FenceCheckResult = {
  findings: DoctorFinding[];
  outcome: DoctorCheckOutcome;
};

/**
 * Deterministic Chesterton's-fence rule (ADR-0010): diff inspection only, milliseconds, zero
 * tokens. It answers one question — did the staged set touch an in-scope source file that has no
 * fence record and no ADR reference? Judging whether the reasoning is any good is the agent's
 * job (the chestertons-fence skill); the gate stays dumb.
 */
export async function checkFence(context: DoctorCheckContext): Promise<FenceCheckResult> {
  if (context.config === undefined) {
    return notEvaluated("no validated Persist OS config, so the fence toggle is unknown");
  }

  if (context.config.fenceEnabled === false) {
    return notEvaluated(
      "the Chesterton fence is disabled (fenceEnabled is false), so crossings are not checked",
    );
  }

  const change = await readChangeSet(context.rootDir);
  if (change.kind === "not-git") {
    return notEvaluated("not inside a git work tree, so the staged set is unknown");
  }
  if (change.kind === "no-upstream") {
    return notEvaluated(NO_UPSTREAM_REASON);
  }
  const changed = change.paths;
  const crossing =
    change.kind === "unpushed"
      ? "Unpushed change"
      : change.kind === "working-tree"
        ? "Uncommitted change"
        : "Change";

  // A brand-new file has no existing logic to misunderstand, so it never crosses — in the
  // staged set, the unpushed commits, and the working tree alike. Renames, copies, and
  // modifications are judged as their (new) path, exactly as before.
  const inScope = changed.filter((file) => change.statuses[file] !== "A" && isInScope(file));
  if (inScope.length === 0) {
    return { findings: [], outcome: { id: "fence", status: "evaluated" } };
  }

  const fencesPath = path.posix.join(context.config.docsDir, FENCES_FILE);
  const fences = await readFences(context.rootDir, fencesPath);
  const adrText = await readAdrText(context.rootDir, context.config.adrDir);

  const findings: DoctorFinding[] = [];
  for (const file of inScope) {
    const reason = fences.get(file);
    if (reason !== undefined) {
      findings.push({
        severity: "info",
        check: "fence",
        message:
          `${crossing} touches a recorded fence: ${reason} ` +
          `(see ${fencesPath}). Confirm the reason still holds before changing the logic.`,
        path: file,
      });
      continue;
    }

    if (adrText.includes(file)) {
      continue;
    }

    findings.push({
      severity: "warning",
      check: "fence",
      message:
        `${crossing} crosses the Chesterton fence with no record: no entry in ${fencesPath} and ` +
        `no ADR reference. Ask why the existing logic is shaped this way (the chestertons-fence ` +
        `skill walks through it) and record the human-confirmed reason.`,
      path: file,
    });
  }

  return { findings, outcome: { id: "fence", status: "evaluated" } };
}

/**
 * A generated folder at the top level or nested anywhere (`pkg/__pycache__/` as well as
 * `__pycache__/`): caches and build output are never logic, wherever the framework puts them.
 */
function isGeneratedDir(normalized: string): boolean {
  return GENERATED_DIR_PREFIXES.some(
    (prefix) => normalized.startsWith(prefix) || normalized.includes(`/${prefix}`),
  );
}

/**
 * Scope is any source file minus obvious non-logic. Deliberately unconfigured (ADR-0010): one
 * more thing to set wrong, and a scope set wrong disables the fence silently.
 *
 * Configuration and migration folders (`config/`, `database/migrations/`, Rails
 * `config/initializers/`) stay in scope on purpose: they can hold real logic, and editing an
 * old migration is exactly the change the fence exists for. New files are already quiet
 * because they are added, not because of where they live.
 */
export function isInScope(repoRelativePath: string): boolean {
  const normalized = repoRelativePath.replace(/\\/gu, "/");

  if (normalized.length === 0 || normalized.startsWith("..")) {
    return false;
  }

  // Dotfiles and dot-directories are tooling and configuration, not logic.
  if (/(^|\/)\./u.test(normalized)) {
    return false;
  }

  if (isTestFile(normalized)) {
    return false;
  }

  const extension = path.posix.extname(normalized).toLowerCase();
  if (STYLE_EXTENSIONS.has(extension) || MARKDOWN_EXTENSIONS.has(extension)) {
    return false;
  }

  const baseName = path.posix.basename(normalized);
  if (LOCKFILE_NAMES.has(baseName)) {
    return false;
  }

  if (isGeneratedDir(normalized)) {
    return false;
  }

  if (GENERATED_FILE_SUFFIXES.some((suffix) => normalized.endsWith(suffix))) {
    return false;
  }

  if (CONFIG_FILE_PATTERN.test(normalized)) {
    return false;
  }

  return true;
}

/** Map of fenced path to its standing `Why:` reason. A missing FENCES.md means no crossings yet. */
async function readFences(rootDir: string, fencesPath: string): Promise<Map<string, string>> {
  const fences = new Map<string, string>();
  const content = await readFileIfExists(rootDir, fencesPath);
  if (content === undefined) {
    return fences;
  }

  let current: string | null = null;
  for (const line of content.split("\n")) {
    const heading = FENCE_HEADING_PATTERN.exec(line);
    if (heading !== null) {
      current = (heading[1] ?? "").trim() || null;
      continue;
    }

    if (current !== null && !fences.has(fenceFileKey(current))) {
      const why = FENCE_WHY_PATTERN.exec(line);
      if (why !== null) {
        fences.set(fenceFileKey(current), (why[1] ?? "").trim());
      }
    }
  }

  return fences;
}

/**
 * Every `.md` file directly under the ADR dir counts as a decision record; a changed path
 * mentioned in any of them means the reasoning is being recorded somewhere, so the fence stays
 * quiet. Substring match covers backticked, suffixed (`path:12`), and bare mentions.
 */
async function readAdrText(rootDir: string, adrDir: string): Promise<string> {
  const bodies = await readAdrBodies(rootDir, adrDir);
  return bodies.join("\n");
}

async function readAdrBodies(rootDir: string, adrDir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(path.join(rootDir, adrDir), { withFileTypes: true });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const bodies: string[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }
    const content = await readFileIfExists(rootDir, path.posix.join(adrDir, entry.name));
    if (content !== undefined) {
      bodies.push(content);
    }
  }

  return bodies;
}

function notEvaluated(reason: string): FenceCheckResult {
  return { findings: [], outcome: { id: "fence", status: "not-evaluated", reason } };
}

async function readFileIfExists(
  rootDir: string,
  relativePath: string,
): Promise<string | undefined> {
  try {
    return await readFile(path.join(rootDir, relativePath), "utf8");
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}
