import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  PRE_COMMIT_HOOK_PATH,
  PRE_PUSH_HOOK_PATH,
  renderPreCommitHook,
  renderPrePushHook,
} from "../../hooks/generate-hook.js";
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
 * silently drop the hand edit. When either hook does not exist there is nothing to compare, so
 * the check reports not-evaluated instead of passing.
 */
export async function checkHookDrift(context: DoctorCheckContext): Promise<HookDriftCheckResult> {
  if (context.config === undefined) {
    return notEvaluated("no validated Persist OS config, so the expected hooks are unknown");
  }

  const expected: [string, string][] = [
    [PRE_COMMIT_HOOK_PATH, renderPreCommitHook(context.config.preCommitGates ?? [])],
    [
      PRE_PUSH_HOOK_PATH,
      renderPrePushHook(context.config.testCommand ?? null, context.config.prePushGates ?? []),
    ],
  ];

  const missing = (
    await Promise.all(
      expected.map(async ([hookPath]) =>
        (await readHook(context.rootDir, hookPath)) === undefined ? hookPath : null,
      ),
    )
  ).filter((hookPath): hookPath is string => hookPath !== null);

  if (missing.length > 0) {
    return notEvaluated(
      `no generated hook at ${missing.join(" and ")}, so drift cannot be measured — run \`persist init\` to generate hooks`,
    );
  }

  const findings: DoctorFinding[] = [];

  for (const [hookPath, expectedContent] of expected) {
    if ((await readHook(context.rootDir, hookPath)) !== expectedContent) {
      findings.push({
        severity: "warning",
        check: "hook-drift",
        message:
          "Generated hook disagrees with .persist/config.json — hand edits are allowed but should be visible. Re-run `persist init --force --reinit` to regenerate it (review the diff first).",
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
