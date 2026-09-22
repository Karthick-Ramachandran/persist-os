import { readdir } from "node:fs/promises";

/**
 * Which backticked tokens in memory are paths to code, whatever the repository's layout.
 *
 * The checks that follow memory to code (code references, staleness) and the context search used
 * to recognise only `src/` and `tests/`. In a Next.js app (`app/`, `components/`), a monorepo
 * (`apps/`, `packages/`), a Python package, or a Go project (`cmd/`, `internal/`) they matched
 * nothing and reported a pass for work they never did.
 *
 * A token counts as a code path when it is a relative path with a folder and a file extension,
 * and its first folder is one that holds code in this repository: any top-level directory except
 * hidden ones, dependencies, build output, and the memory folder itself. `src/` and `tests/` always
 * count, so a reference into a folder that was deleted outright is still caught there.
 */
const CANDIDATE_PATTERN = /`([A-Za-z0-9_@][A-Za-z0-9._@/-]*\/[A-Za-z0-9._@/-]*\.[A-Za-z0-9]+)`/gu;

/** Illustrative paths: placeholders, globs, and elisions are examples, not references. */
const PLACEHOLDER_MARKERS = /[<>*]|\.\.\./u;

const ALWAYS_CODE = ["src", "tests"];

const NOT_CODE = new Set([
  "node_modules",
  "vendor",
  "dist",
  "build",
  "out",
  "coverage",
  "target",
  "bin",
  "obj",
]);

export type CodeRoots = ReadonlySet<string>;

/** The top-level folders that hold code in this repository. */
export async function readCodeRoots(rootDir: string, docsDir: string): Promise<CodeRoots> {
  const memoryRoot = docsDir.split("/")[0] ?? docsDir;
  const roots = new Set(ALWAYS_CODE);
  try {
    for (const entry of await readdir(rootDir, { withFileTypes: true })) {
      if (
        entry.isDirectory() &&
        !entry.name.startsWith(".") &&
        !NOT_CODE.has(entry.name) &&
        entry.name !== memoryRoot
      ) {
        roots.add(entry.name);
      }
    }
  } catch {
    // An unreadable root still recognises the always-code folders.
  }
  return roots;
}

/** Code paths mentioned in memory text, in order of first mention, without duplicates. */
export function codePathsIn(text: string, roots: CodeRoots): string[] {
  const found: string[] = [];
  for (const match of text.matchAll(CANDIDATE_PATTERN)) {
    const value = match[1] ?? "";
    if (
      value === "" ||
      found.includes(value) ||
      PLACEHOLDER_MARKERS.test(value) ||
      value.split("/").includes("..")
    ) {
      continue;
    }
    if (roots.has(value.split("/")[0] ?? "")) {
      found.push(value);
    }
  }
  return found;
}
