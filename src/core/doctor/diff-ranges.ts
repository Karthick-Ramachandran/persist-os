import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { ChangeSet } from "./change-set.js";

const execFileAsync = promisify(execFile);

/**
 * One rewritten span of existing code: old-side line numbers from a
 * `git diff -U0` hunk header (`@@ -a,b +c,d @@ <context>`), with git's hunk
 * context text trimmed and clipped. `start === end` is a single line.
 */
export type RewrittenRange = {
  start: number;
  end: number;
  context: string;
};

/**
 * What one file's diff says, keyed by the judged (new, for renames) path:
 * - `binary` when git reports `Binary files … differ` instead of hunks.
 * - `rewrites` for hunks that remove or change existing lines (`b > 0`).
 * - `inserts` for pure-addition hunks (`b = 0`): the old-side line the new
 *   lines land after. An early `return` above four writes removes nothing and
 *   still changes behaviour, so a file with only inserts still warns.
 */
export type FileDiffRanges = {
  binary: boolean;
  rewrites: RewrittenRange[];
  inserts: { line: number; context: string }[];
};

const HUNK_PATTERN = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@ ?(.*)$/u;

/** Git's hunk context is language-agnostic and imperfect; that is acceptable. */
const MAX_CONTEXT_CHARS = 60;

/**
 * Read `git diff -U0` once per change set — not once per file — for exactly the
 * change the fence judges (staged, unpushed, or working tree; see
 * `change-set.ts`). Unpushed merges the commit diff with the uncommitted one,
 * the way the judged change unions both sets.
 */
export async function readDiffRanges(
  rootDir: string,
  change: ChangeSet,
): Promise<Map<string, FileDiffRanges>> {
  if (change.kind === "staged") {
    return parsePatch(await runDiff(rootDir, ["diff", "--cached", "-U0", "--no-color"]));
  }
  if (change.kind === "unpushed") {
    const committed = await runDiff(rootDir, [
      "diff",
      "-U0",
      "--no-color",
      "--diff-filter=ACMR",
      "@{upstream}...HEAD",
    ]);
    const worktree = await runDiff(rootDir, ["diff", "-U0", "--no-color", "--diff-filter=ACMR"]);
    return mergeDiffs(parsePatch(committed), parsePatch(worktree));
  }
  if (change.kind === "working-tree") {
    return parsePatch(await runDiff(rootDir, ["diff", "-U0", "--no-color", "--diff-filter=ACMR"]));
  }
  return new Map();
}

async function runDiff(rootDir: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd: rootDir,
      maxBuffer: 64 * 1024 * 1024,
    });
    return stdout;
  } catch {
    return "";
  }
}

/** Union by path, committed hunks first: the same path can appear in both diffs. */
function mergeDiffs(
  first: Map<string, FileDiffRanges>,
  second: Map<string, FileDiffRanges>,
): Map<string, FileDiffRanges> {
  const merged = new Map(first);
  for (const [file, diff] of second) {
    const existing = merged.get(file);
    if (existing === undefined) {
      merged.set(file, diff);
    } else {
      merged.set(file, {
        binary: existing.binary || diff.binary,
        rewrites: [...existing.rewrites, ...diff.rewrites],
        inserts: [...existing.inserts, ...diff.inserts],
      });
    }
  }
  return merged;
}

function emptyDiff(): FileDiffRanges {
  return { binary: false, rewrites: [], inserts: [] };
}

function diffFor(diffs: Map<string, FileDiffRanges>, file: string): FileDiffRanges {
  let diff = diffs.get(file);
  if (diff === undefined) {
    diff = emptyDiff();
    diffs.set(file, diff);
  }
  return diff;
}

/**
 * Parse a `-U0` patch. The judged path comes from the `+++ b/` line (the new
 * side, so renames read as their new path, as the change set judges them);
 * `/dev/null` sides are creations or deletions, never crossings.
 */
export function parsePatch(patch: string): Map<string, FileDiffRanges> {
  const diffs = new Map<string, FileDiffRanges>();
  let current: string | null = null;

  for (const line of patch.split("\n")) {
    if (line.startsWith("diff --git ")) {
      // Binary patches carry no `+++ ` line, so take the judged (new, for
      // renames) path from the `diff --git ` header itself; a `+++ ` line
      // below refines it to the same value.
      current = parseDiffGitPaths(line);
      continue;
    }
    if (line.startsWith("diff --cc ")) {
      current = null;
      continue;
    }
    if (line.startsWith("Binary files ")) {
      if (current !== null) {
        diffFor(diffs, current).binary = true;
      }
      continue;
    }
    if (line.startsWith("+++ ")) {
      current = parsePlusPath(line.slice(4));
      continue;
    }
    const hunk = HUNK_PATTERN.exec(line);
    if (hunk !== null && current !== null) {
      const oldStart = Number.parseInt(hunk[1] ?? "0", 10);
      const oldCount = hunk[2] === undefined ? 1 : Number.parseInt(hunk[2], 10);
      const context = clipContext(hunk[5] ?? "");
      const diff = diffFor(diffs, current);
      if (oldCount === 0) {
        diff.inserts.push({ line: oldStart, context });
      } else {
        diff.rewrites.push({ start: oldStart, end: oldStart + oldCount - 1, context });
      }
    }
  }

  return diffs;
}

/**
 * The judged path from a `diff --git a/<old> b/<new>` header: the new side,
 * so renames read as their new path. Quoted when hostile, like `+++ ` lines.
 */
function parseDiffGitPaths(line: string): string | null {
  const rest = line.slice("diff --git ".length).trim();
  // Git quotes hostile paths (`"a/my file" "b/my file"`); an unquoted header
  // splits once at the ` b/` boundary, which the old side never contains
  // unquoted — a space there would have been quoted.
  if (rest.startsWith('"') || rest.startsWith("'")) {
    const next = splitGitPaths(rest)[1] ?? "";
    return next === "" || next === "/dev/null" ? null : stripABPrefix(next, "b/");
  }
  const separator = rest.indexOf(" b/");
  if (separator === -1) {
    return null;
  }
  const next = rest.slice(separator + 1);
  return next === "/dev/null" ? null : stripABPrefix(next, "b/");
}

/** Split `a/<old> b/<new>`, honouring git's double-quoting of hostile paths. */
function splitGitPaths(rest: string): string[] {
  const paths: string[] = [];
  let current = "";
  let quoted: string | null = null;
  for (const char of rest) {
    if (quoted !== null) {
      current += char;
      if (char === quoted) {
        quoted = null;
      }
    } else if (char === '"' || char === "'") {
      quoted = char;
      current += char;
    } else if (char === " " && current !== "") {
      paths.push(current);
      current = "";
    } else if (char !== " ") {
      current += char;
    }
  }
  if (current !== "") {
    paths.push(current);
  }
  return paths.map((entry) => {
    if (entry.startsWith('"') && entry.endsWith('"') && entry.length >= 2) {
      try {
        return JSON.parse(entry) as string;
      } catch {
        return entry.slice(1, -1);
      }
    }
    return entry;
  });
}

function stripABPrefix(value: string, prefix: string): string {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

/** `+++ b/<path>`, honouring the quoting git uses for hostile filenames. */
function parsePlusPath(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === "/dev/null") {
    return null;
  }
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    try {
      return stripBPrefix(JSON.parse(trimmed) as string);
    } catch {
      return stripBPrefix(trimmed.slice(1, -1));
    }
  }
  return stripBPrefix(trimmed);
}

function stripBPrefix(value: string): string {
  return value.startsWith("b/") ? value.slice(2) : value;
}

function clipContext(raw: string): string {
  return raw.trim().slice(0, MAX_CONTEXT_CHARS).trimEnd();
}
