import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * The change doctor judges, shared by every check that asks "what is this change?" (the fence,
 * governing ADRs) so they can never disagree about it.
 *
 * - `staged`: something is staged, so doctor is running inside a commit; judge exactly that.
 * - `unpushed`: nothing is staged, so doctor is running outside a commit — often right after
 *   one, with the hooks off. Judging the empty staged set would pass a change that never met
 *   the checks, so the commits the branch has not pushed are the change instead.
 * - `no-upstream`: nothing staged and nothing to compare against; say so, never an empty pass.
 * - `not-git`: git cannot answer.
 */
export type ChangeSet =
  | { kind: "staged" | "unpushed"; paths: string[] }
  | { kind: "no-upstream" }
  | { kind: "not-git" };

export const NO_UPSTREAM_REASON =
  "nothing is staged and the branch has no upstream, so there is no change to check — the pre-commit hook checks each commit as it is made";

export async function readChangeSet(rootDir: string): Promise<ChangeSet> {
  const staged = await stagedFiles(rootDir);
  if (staged === null) {
    return { kind: "not-git" };
  }
  if (staged.any) {
    return { kind: "staged", paths: staged.paths };
  }

  const pending = await unpushedFiles(rootDir);
  return pending === null ? { kind: "no-upstream" } : { kind: "unpushed", paths: pending };
}

/**
 * The staged set. `paths` holds added/copied/modified/renamed paths (NUL-separated for hostile
 * filenames); deleted files need no fence, since there is no logic left to misunderstand.
 * `any` says whether anything is staged at all — a commit that only deletes is still a commit,
 * and must not be mistaken for "nothing staged". null when git cannot run — non-git repo, no
 * git binary, or any other failure reads as "cannot run", never as clean.
 */
async function stagedFiles(rootDir: string): Promise<{ any: boolean; paths: string[] } | null> {
  try {
    const names = async (filter: string[]) =>
      (
        await execFileAsync("git", ["diff", "--cached", "--name-only", "-z", ...filter], {
          cwd: rootDir,
        })
      ).stdout
        .split("\0")
        .filter((entry) => entry.length > 0);
    const paths = await names(["--diff-filter=ACMR"]);
    const any = paths.length > 0 || (await names([])).length > 0;
    return { any, paths };
  } catch {
    return null;
  }
}

/**
 * Paths the branch changed since its upstream, when nothing is staged. `@{upstream}...HEAD`
 * diffs from the merge base, so commits that arrived from the remote are not counted as ours.
 * null when there is no upstream (a new branch, a detached CI checkout) or git cannot answer.
 */
async function unpushedFiles(rootDir: string): Promise<string[] | null> {
  try {
    await execFileAsync("git", ["rev-parse", "--verify", "--quiet", "@{upstream}"], {
      cwd: rootDir,
    });
    const { stdout } = await execFileAsync(
      "git",
      ["diff", "--name-only", "-z", "--diff-filter=ACMR", "@{upstream}...HEAD"],
      { cwd: rootDir },
    );
    return stdout.split("\0").filter((entry) => entry.length > 0);
  } catch {
    return null;
  }
}
