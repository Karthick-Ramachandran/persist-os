import { lstat, realpath, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Whether a repository file is present for reading, following a symlink that stays inside the
 * repository.
 *
 * Many repositories keep one set of agent rules and link the rest to it (`CLAUDE.md` →
 * `AGENTS.md`). Checking with `lstat` alone saw the link, not a file, so doctor reported
 * `CLAUDE.md` as missing: an error, which made the pre-commit hook block every commit in those
 * repositories. A link whose target resolves outside the repository still counts as missing;
 * writing never follows links at all (see the write plan), and this only answers "can doctor read
 * it".
 */
export async function isPresentFile(rootDir: string, relativePath: string): Promise<boolean> {
  return (await presentKind(rootDir, relativePath)) === "file";
}

export async function isPresentDirectory(rootDir: string, relativePath: string): Promise<boolean> {
  return (await presentKind(rootDir, relativePath)) === "directory";
}

async function presentKind(
  rootDir: string,
  relativePath: string,
): Promise<"file" | "directory" | "other" | "missing"> {
  const full = path.join(rootDir, relativePath);
  try {
    const entry = await lstat(full);
    if (!entry.isSymbolicLink()) {
      return entry.isFile() ? "file" : entry.isDirectory() ? "directory" : "other";
    }

    const [target, root] = await Promise.all([realpath(full), realpath(rootDir)]);
    const inside = target === root || target.startsWith(`${root}${path.sep}`);
    if (!inside) {
      return "missing";
    }
    const resolved = await stat(target);
    return resolved.isFile() ? "file" : resolved.isDirectory() ? "directory" : "other";
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    // A dangling link, or a path that doesn't exist, is simply not there.
    if (nodeError.code === "ENOENT" || nodeError.code === "ENOTDIR") {
      return "missing";
    }
    throw error;
  }
}
