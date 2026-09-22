import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import {
  ADR_FILE_PATTERN,
  PROPOSED_ADR_FILE_PATTERN,
  adrStandingOf,
  adrTitleOf,
  type AdrStanding,
} from "../../adr/governing-adrs.js";
import { noConstraintFiles, whyReasonsByFile } from "../../fence/fence-entries.js";
import { isTestFile } from "../../naming/test-files.js";
import { NO_UPSTREAM_REASON, readChangeSet } from "../change-set.js";
import { readDiffRanges, type FileDiffRanges } from "../diff-ranges.js";
import type { DoctorCheckContext, DoctorCheckOutcome, DoctorFinding } from "../doctor-check.js";

/** FENCES.md location under the configured docs dir (ADR-0010). Never required, only written. */
const FENCES_FILE = "60-engineering/FENCES.md";

/** At most this many ranges in a warning; the rest collapse to `and N more`. */
const MAX_RANGES_IN_MESSAGE = 3;

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
  const fencesContent = await readFileIfExists(context.rootDir, fencesPath);
  const reasons =
    fencesContent === undefined ? new Map<string, string>() : whyReasonsByFile(fencesContent);
  const cleared =
    fencesContent === undefined ? new Set<string>() : noConstraintFiles(fencesContent);
  const adrs = await readFenceAdrs(context.rootDir, context.config.adrDir);
  const diffs = await readDiffRanges(context.rootDir, change);

  const findings: DoctorFinding[] = [];
  for (const file of inScope) {
    const reason = reasons.get(file);
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

    // A human-confirmed "no constraint" is an answer, recorded: the file stays quiet.
    // A `Why:` entry for the file wins over it (see the shared reader), so a real reason
    // is never replaced by its absence.
    if (cleared.has(file)) {
      continue;
    }

    // An Accepted ADR that still binds and names the file is the recorded reason, so the
    // fence stays quiet. A file named only by Proposed ADRs is reported for review: a draft
    // naming the file is not a human-confirmed reason. Anything else warns, as before.
    if (adrs.some((adr) => adr.standing === "accepted" && mentionsPath(adr.body, file))) {
      continue;
    }

    const proposed = adrs
      .filter((adr) => adr.standing === "proposed" && mentionsPath(adr.body, file))
      .sort(
        (left, right) =>
          (left.number ?? Number.MAX_SAFE_INTEGER) - (right.number ?? Number.MAX_SAFE_INTEGER) ||
          (left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
      )[0];
    if (proposed !== undefined) {
      findings.push({
        severity: "info",
        check: "fence",
        message:
          `${crossing} to ${file} is covered only by Proposed ${proposed.id} ` +
          `(${proposed.title}), pending review. Accept it if it records why this code is ` +
          `shaped this way, or record the reason with persist fence add.`,
        path: file,
      });
      continue;
    }

    findings.push(warnCrossing(crossing, file, diffs.get(file)));
  }

  return { findings, outcome: { id: "fence", status: "evaluated" } };
}

/**
 * The answerable question: which existing lines the diff rewrites (old-side
 * ranges from one `git diff -U0` per change set), or where it only adds. The
 * `Ask the person who knows` tail names both ready-to-run answers, so the
 * human replies with one command per file. Severity, check id, and path are
 * unchanged: everything that warned still warns, now with its lines named.
 */
function warnCrossing(
  crossing: string,
  file: string,
  diff: FileDiffRanges | undefined,
): DoctorFinding {
  const ask =
    `Ask the person who knows: was that behaviour deliberate? ` +
    `If yes: persist fence add ${file} --why "<reason>" --by <name>. ` +
    `If no: persist fence add ${file} --no-constraint --by <name>.`;

  if (diff !== undefined && diff.rewrites.length > 0) {
    return {
      severity: "warning",
      check: "fence",
      message:
        `${crossing} rewrites existing code in ${file} with no recorded reason: ` +
        `${describeRanges(diff.rewrites)}. ${ask}`,
      path: file,
      ranges: diff.rewrites.map((range) => ({ ...range })),
    };
  }

  if (diff !== undefined && diff.inserts.length > 0) {
    return {
      severity: "warning",
      check: "fence",
      message:
        `${crossing} adds to ${file} with no recorded reason: ` +
        `adds lines at ${describeInserts(diff.inserts)}. ${ask}`,
      path: file,
      ranges: diff.inserts.map((insert) => ({
        start: insert.line,
        end: insert.line,
        context: insert.context,
      })),
    };
  }

  if (diff !== undefined && diff.binary) {
    return {
      severity: "warning",
      check: "fence",
      message: `${crossing} changes ${file} with no recorded reason: binary change. ${ask}`,
      path: file,
    };
  }

  return {
    severity: "warning",
    check: "fence",
    message: `${crossing} changes ${file} with no recorded reason. ${ask}`,
    path: file,
  };
}

/** `line 40 (in …)`, `lines 12-18 (in …)`: at most three, then `and N more`. */
function describeRanges(ranges: { start: number; end: number; context: string }[]): string {
  const shown = ranges.slice(0, MAX_RANGES_IN_MESSAGE).map((range) => {
    const lines =
      range.start === range.end ? `line ${range.start}` : `lines ${range.start}-${range.end}`;
    return range.context === "" ? lines : `${lines} (in \`${range.context}\`)`;
  });
  return withMore(shown, ranges.length);
}

function describeInserts(inserts: { line: number }[]): string {
  return withMore(
    inserts.slice(0, MAX_RANGES_IN_MESSAGE).map((insert) => `${insert.line}`),
    inserts.length,
  );
}

function withMore(shown: string[], total: number): string {
  if (total <= MAX_RANGES_IN_MESSAGE) {
    return shown.join(", ");
  }
  return `${shown.join(", ")} and ${total - MAX_RANGES_IN_MESSAGE} more`;
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

/**
 * What the fence reads: numbered ADRs (`ADR-0007-<slug>.md`) directly under the ADR dir, plus
 * proposals waiting under `<adrDir>/proposed/` (`ADR-PROPOSED-<slug>.md`), which count as
 * Proposed. Nothing else in the folder counts — not the index, not the template. Standing
 * comes from the one shared status reader, so the fence and the governing-ADRs check agree.
 */
type FenceAdr = {
  id: string;
  title: string;
  standing: AdrStanding;
  /** ADR number for ordering, or null for unnumbered proposals under `proposed/`. */
  number: number | null;
  body: string;
};

async function readFenceAdrs(rootDir: string, adrDir: string): Promise<FenceAdr[]> {
  const adrs: FenceAdr[] = [];

  for (const name of await listFiles(rootDir, adrDir)) {
    const match = ADR_FILE_PATTERN.exec(name);
    if (match === null) {
      continue;
    }
    const file = path.posix.join(adrDir, name);
    const body = await readFileIfExists(rootDir, file);
    if (body === undefined) {
      continue;
    }
    const number = Number.parseInt(match[1] ?? "", 10);
    adrs.push({
      id: (match[1] ?? "").toUpperCase(),
      title: adrTitleOf(body, name),
      standing: adrStandingOf(body),
      number: Number.isNaN(number) ? null : number,
      body,
    });
  }

  for (const name of await listFiles(rootDir, path.posix.join(adrDir, "proposed"))) {
    if (PROPOSED_ADR_FILE_PATTERN.exec(name) === null) {
      continue;
    }
    const file = path.posix.join(adrDir, "proposed", name);
    const body = await readFileIfExists(rootDir, file);
    if (body === undefined) {
      continue;
    }
    adrs.push({
      id: `ADR-PROPOSED-${name.replace(/^ADR-PROPOSED-|\.md$/gu, "")}`,
      title: adrTitleOf(body, name),
      // Proposals count as Proposed by location: a draft is a draft wherever its status line
      // stands, until a human accepts it out of this folder.
      standing: "proposed",
      number: null,
      body,
    });
  }

  return adrs;
}

/**
 * A mention counts only as a whole path: not glued to a longer path on either side. A
 * `:line` suffix still counts (`src/a.ts:12`), and backticked, bulleted, and bare mentions
 * all still count — they were never glued to anything. Sentence punctuation is not a path
 * character: one trailing `.`, `,`, `;`, or `)` followed by whitespace or the end of the
 * text still counts (`see src/a.ts. Then…`), and so does a leading `./` (`./src/a.ts`).
 */
function mentionsPath(body: string, repoRelativePath: string): boolean {
  const pattern = new RegExp(
    `(?<![A-Za-z0-9/._-])(?:\\./)?${escapeRegExp(repoRelativePath)}(?::\\d+|[.,;)](?=\\s|$))?(?![A-Za-z0-9/._-])`,
    "u",
  );
  return pattern.test(body);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

async function listFiles(rootDir: string, relativeDir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(path.join(rootDir, relativeDir), { withFileTypes: true });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return [];
    }
    throw error;
  }
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
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
