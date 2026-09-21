import { execFile } from "node:child_process";
import { realpath } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { HOOKS_DIR } from "./generate-hook.js";

const execFileAsync = promisify(execFile);

/**
 * Whether this clone runs Persist's hooks. Git never activates hooks that arrive with a clone —
 * a security property — so every clone opts in once through `core.hooksPath` (ADR-0014).
 *
 * - `active`: `core.hooksPath` resolves to `.persist/hooks`.
 * - `unset`: nothing is configured, so git uses `.git/hooks` and Persist's hooks never run.
 * - `other`: another tool (Husky, lefthook, …) owns `core.hooksPath`. Never overwritten.
 * - `not-git`: not inside a git work tree, so there is no clone to configure.
 */
export type HooksPathState =
  | { kind: "active" }
  | { kind: "unset" }
  | { kind: "other"; value: string }
  | { kind: "not-git" };

export async function readHooksPathState(rootDir: string): Promise<HooksPathState> {
  let topLevel: string;
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--show-toplevel"], {
      cwd: rootDir,
    });
    topLevel = stdout.trim();
  } catch {
    return { kind: "not-git" };
  }

  let value: string;
  try {
    const { stdout } = await execFileAsync("git", ["config", "--get", "core.hooksPath"], {
      cwd: rootDir,
    });
    value = stdout.trim();
  } catch {
    // `git config --get` exits 1 when the key is unset.
    return { kind: "unset" };
  }

  if (value === "") {
    return { kind: "unset" };
  }

  // A relative core.hooksPath is resolved from the top of the work tree. Compare real paths so
  // `/tmp` and `/private/tmp` (or a symlinked checkout) do not read as two different places.
  const configured = await realPathOr(path.resolve(topLevel, value));
  const ours = await realPathOr(path.resolve(rootDir, HOOKS_DIR));
  return configured === ours ? { kind: "active" } : { kind: "other", value };
}

/**
 * Point `core.hooksPath` at `.persist/hooks` for this clone, unless another tool already owns
 * it. Local configuration only: nothing is committed. Returns the state init should report.
 */
export async function enableHooks(rootDir: string): Promise<HooksPathState> {
  const state = await readHooksPathState(rootDir);
  if (state.kind !== "unset") {
    return state;
  }

  await execFileAsync("git", ["config", "core.hooksPath", HOOKS_DIR], { cwd: rootDir });
  return readHooksPathState(rootDir);
}

async function realPathOr(target: string): Promise<string> {
  try {
    return await realpath(target);
  } catch {
    return target;
  }
}
