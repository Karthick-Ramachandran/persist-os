import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * The change doctor judges, shared by every check that asks "what is this change?" (the fence,
 * governing ADRs) so they can never disagree about it.
 *
 * - `staged`: something is staged, so doctor is running inside a commit; judge exactly that.
 * - `unpushed`: nothing is staged, so doctor is running outside a commit — often right after
 *   one, with the hooks off. The task loop runs doctor before calling work done, which is before
 *   commit, so the change is the unpushed commits plus the uncommitted working-tree changes
 *   (tracked modifications and untracked files, respecting `.gitignore`).
 * - `working-tree`: nothing staged and no upstream to compare against; the working-tree
 *   changes alone are the change.
 * - `no-upstream`: nothing staged, no upstream, and a clean tree; say so, never an empty pass.
 * - `not-git`: git cannot answer.
 *
 * Every entry carries the git status of its path (`A` added, `M` modified, `C` copied,
 * `R` renamed): a brand-new file has no existing logic to misunderstand, so the fence never
 * counts it as a crossing, while governing ADRs still name it. A rename is judged as its new
 * path. Untracked working-tree files read as added.
 */
export type ChangeSet =
  | { kind: "staged" | "unpushed" | "working-tree"; paths: string[]; statuses: ChangeStatuses }
  | { kind: "no-upstream" }
  | { kind: "not-git" };

/** Git status per judged path, keyed by the path itself (the new path for renames). */
export type ChangeStatuses = Record<string, ChangeStatus>;

/** Status letters git reports; `D` never appears here (deletions are filtered at the source). */
export type ChangeStatus = "A" | "B" | "C" | "M" | "R" | "T" | "U" | "X";

export const NO_UPSTREAM_REASON =
  "nothing is staged and the branch has no upstream, so there is no change to check — the pre-commit hook checks each commit as it is made";

export async function readChangeSet(rootDir: string): Promise<ChangeSet> {
  const staged = await stagedFiles(rootDir);
  if (staged === null) {
    return { kind: "not-git" };
  }
  if (staged.any) {
    return withPaths("staged", staged.entries);
  }

  const [pending, worktree] = await Promise.all([
    unpushedFiles(rootDir),
    workingTreeFiles(rootDir),
  ]);
  if (worktree === null) {
    return { kind: "not-git" };
  }
  if (pending === null) {
    return worktree.length > 0 ? withPaths("working-tree", worktree) : { kind: "no-upstream" };
  }
  return withPaths("unpushed", unionEntries(pending, worktree));
}

function withPaths(
  kind: "staged" | "unpushed" | "working-tree",
  entries: ChangeEntry[],
): ChangeSet {
  const paths = entries.map((entry) => entry.path);
  const statuses: ChangeStatuses = {};
  for (const entry of entries) {
    statuses[entry.path] = entry.status;
  }
  return { kind, paths, statuses };
}

/** One judged path with its git status; renames carry the new path. */
type ChangeEntry = {
  path: string;
  status: ChangeStatus;
};

/**
 * Parse `--name-status -z` output into entries. Single-path statuses (`A`, `M`, …) read as
 * `<status> NUL <path>`, while renames and copies carry a similarity score and both paths
 * (`R100 NUL <old> NUL <new>`); the new path is what the change is judged as.
 */
function parseNameStatus(stdout: string): ChangeEntry[] {
  const tokens = stdout.split("\0").filter((entry) => entry.length > 0);
  const entries: ChangeEntry[] = [];
  let index = 0;
  while (index < tokens.length) {
    const statusToken = tokens[index] ?? "";
    const status = (statusToken[0] ?? "M") as ChangeStatus;
    if (status === "R" || status === "C") {
      const newPath = tokens[index + 2];
      if (newPath !== undefined) {
        entries.push({ path: newPath, status });
      }
      index += 3;
    } else {
      const entryPath = tokens[index + 1];
      if (entryPath !== undefined) {
        entries.push({ path: entryPath, status });
      }
      index += 2;
    }
  }
  return entries;
}

/** Statuses the change keeps: added, copied, modified, renamed. Deletions need no fence. */
function isKeptStatus(status: string): boolean {
  return status === "A" || status === "C" || status === "M" || status === "R";
}

/**
 * The staged set. `entries` holds added/copied/modified/renamed paths (NUL-separated for hostile
 * filenames); deleted files need no fence, since there is no logic left to misunderstand.
 * `any` says whether anything is staged at all — a commit that only deletes is still a commit,
 * and must not be mistaken for "nothing staged". null when git cannot run — non-git repo, no
 * git binary, or any other failure reads as "cannot run", never as clean.
 */
async function stagedFiles(
  rootDir: string,
): Promise<{ any: boolean; entries: ChangeEntry[] } | null> {
  try {
    const { stdout } = await execFileAsync("git", ["diff", "--cached", "--name-status", "-z"], {
      cwd: rootDir,
    });
    const entries = parseNameStatus(stdout).filter((entry) => isKeptStatus(entry.status));
    return { any: stdout.split("\0").some((token) => token.length > 0), entries };
  } catch {
    return null;
  }
}

/**
 * Paths the branch changed since its upstream, when nothing is staged. `@{upstream}...HEAD`
 * diffs from the merge base, so commits that arrived from the remote are not counted as ours.
 * null when there is no upstream (a new branch, a detached CI checkout) or git cannot answer.
 */
async function unpushedFiles(rootDir: string): Promise<ChangeEntry[] | null> {
  try {
    await execFileAsync("git", ["rev-parse", "--verify", "--quiet", "@{upstream}"], {
      cwd: rootDir,
    });
    const { stdout } = await execFileAsync(
      "git",
      ["diff", "--name-status", "-z", "--diff-filter=ACMR", "@{upstream}...HEAD"],
      { cwd: rootDir },
    );
    return parseNameStatus(stdout);
  } catch {
    return null;
  }
}

/**
 * Uncommitted working-tree changes when nothing is staged: unstaged tracked modifications
 * plus untracked files. `ls-files --others --exclude-standard` respects `.gitignore`, so
 * ignored files never enter the change. Untracked files read as added. null when git cannot
 * answer.
 */
async function workingTreeFiles(rootDir: string): Promise<ChangeEntry[] | null> {
  try {
    const [unstaged, untracked] = await Promise.all([
      execFileAsync("git", ["diff", "--name-status", "-z", "--diff-filter=ACMR"], {
        cwd: rootDir,
      }),
      execFileAsync("git", ["ls-files", "--others", "--exclude-standard", "-z"], {
        cwd: rootDir,
      }),
    ]);
    const tracked = parseNameStatus(unstaged.stdout);
    const added = untracked.stdout
      .split("\0")
      .filter((entry) => entry.length > 0)
      .map((entryPath) => ({ path: entryPath, status: "A" as ChangeStatus }));
    return unionEntries(tracked, added);
  } catch {
    return null;
  }
}

/**
 * Union by path, first occurrence winning its status: unpushed commits outrank working-tree
 * edits for the same path, and a tracked modification outranks a same-path untracked entry.
 */
function unionEntries(first: ChangeEntry[], second: ChangeEntry[]): ChangeEntry[] {
  const seen = new Set(first.map((entry) => entry.path));
  const entries = [...first];
  for (const entry of second) {
    if (!seen.has(entry.path)) {
      seen.add(entry.path);
      entries.push(entry);
    }
  }
  return entries;
}
