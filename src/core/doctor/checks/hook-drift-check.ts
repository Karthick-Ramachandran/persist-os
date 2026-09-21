import { readFile } from "node:fs/promises";
import path from "node:path";

import { CLAUDE_SETTINGS_PATH, expectedHookFiles } from "../../hooks/generate-hook.js";
import type { DoctorCheckContext, DoctorCheckOutcome, DoctorFinding } from "../doctor-check.js";

export type HookDriftCheckResult = {
  findings: DoctorFinding[];
  outcome: DoctorCheckOutcome;
};

/**
 * Deterministic hook-drift check. The generated git hooks are rendered output: the config that
 * produced them is the source of truth. This check regenerates both hooks from the validated
 * config in memory and diffs them against the tracked files.
 *
 * A mismatch is a warning, not an error — a hand-edited hook is a legitimate choice, but it
 * should be visible, not silently trusted. Regenerating from a drifted config would otherwise
 * silently drop the hand edit. When an expected file does not exist there is nothing to compare,
 * so the check reports not-evaluated instead of passing. `persist hooks sync` repairs
 * exactly what this check flags, because both read `expectedHookFiles`.
 *
 * The Claude SessionStart hook and its settings file are covered too, because they are generated
 * output like the git hooks — and because they are the ones that drift silently: they carry the
 * memory map and the fence index, so a stale one loads the wrong context into every session
 * without anything failing. Which files are expected follows `aiTools`, so a Codex-only
 * repository is not measured against Claude files it never asked for.
 */
export async function checkHookDrift(context: DoctorCheckContext): Promise<HookDriftCheckResult> {
  if (context.config === undefined) {
    return notEvaluated("no validated Persist OS config, so the expected hooks are unknown");
  }

  const expected: [string, string][] = expectedHookFiles(context.config).map((file) => [
    file.path,
    file.content,
  ]);

  const missing = (
    await Promise.all(
      expected.map(async ([hookPath]) =>
        (await readHook(context.rootDir, hookPath)) === undefined ? hookPath : null,
      ),
    )
  ).filter((hookPath): hookPath is string => hookPath !== null);

  if (missing.length > 0) {
    return notEvaluated(
      `no generated file at ${missing.join(" and ")}, so drift cannot be measured — run \`persist hooks sync\` to generate it`,
    );
  }

  const findings: DoctorFinding[] = [];

  for (const [hookPath, expectedContent] of expected) {
    if ((await readHook(context.rootDir, hookPath)) !== expectedContent) {
      findings.push({
        severity: "warning",
        check: "hook-drift",
        message:
          hookPath === CLAUDE_SETTINGS_PATH
            ? "Claude settings disagree with what this version of Persist OS produces — often your own settings sit alongside the SessionStart entry, which is fine. Merge the SessionStart hook entry by hand if it is missing; `persist hooks sync` never overwrites this file."
            : "Generated file disagrees with what this version of Persist OS produces — hand edits are allowed but should be visible. Run `persist hooks sync --dry-run` to preview, then `persist hooks sync` to regenerate it; it rewrites only the generated hooks, never docs or config.",
        path: hookPath,
      });
    }
  }

  return { findings, outcome: { id: "hook-drift", status: "evaluated" } };
}

function notEvaluated(reason: string): HookDriftCheckResult {
  return {
    findings: [],
    outcome: { id: "hook-drift", status: "not-evaluated", reason },
  };
}

async function readHook(rootDir: string, relativePath: string): Promise<string | undefined> {
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
