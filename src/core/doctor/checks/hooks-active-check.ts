import { existsSync } from "node:fs";
import path from "node:path";

import { readHooksPathState } from "../../hooks/activate-hooks.js";
import { HOOKS_PATH_ACTIVATION_COMMAND, PRE_COMMIT_HOOK_PATH } from "../../hooks/generate-hook.js";
import type { DoctorCheckContext, DoctorCheckOutcome, DoctorFinding } from "../doctor-check.js";

export type HooksActiveCheckResult = {
  findings: DoctorFinding[];
  outcome: DoctorCheckOutcome;
};

/**
 * Are the generated hooks switched on in this clone (ADR-0014)? Git never turns on hooks that
 * arrive with a clone, so a teammate's fresh checkout has them written but inert: doctor never
 * runs at commit and the test gate never runs at push, with nothing saying so. This check says so.
 *
 * Not evaluated where the question does not apply: outside git, without generated hooks, and in
 * CI (the `CI` environment variable), where hooks are never switched on and a warning would fail
 * the generated workflow for no reason. When another tool owns `core.hooksPath` the finding is
 * info, not a warning — chaining Persist's hooks from Husky or lefthook is a legitimate setup.
 */
export async function checkHooksActive(
  context: DoctorCheckContext,
  env: NodeJS.ProcessEnv = process.env,
): Promise<HooksActiveCheckResult> {
  if (context.config === undefined) {
    return notEvaluated("no validated Persist OS config, so the hooks setup is unknown");
  }
  if (isCi(env)) {
    return notEvaluated(
      "running in CI (CI is set); hooks are a per-clone setting for developer machines",
    );
  }
  if (!existsSync(path.join(context.rootDir, PRE_COMMIT_HOOK_PATH))) {
    return notEvaluated(
      `no generated hook at ${PRE_COMMIT_HOOK_PATH}, so there is nothing to switch on`,
    );
  }

  const state = await readHooksPathState(context.rootDir);
  switch (state.kind) {
    case "not-git":
      return notEvaluated("not a git repository, so there is no clone to switch the hooks on in");
    case "active":
      return { findings: [], outcome: { id: "hooks-active", status: "evaluated" } };
    case "unset":
      return evaluated({
        severity: "warning",
        check: "hooks-active",
        message: `Git hooks are not switched on in this clone, so doctor does not run at commit and the test gate does not run at push. Switch them on once: ${HOOKS_PATH_ACTIVATION_COMMAND}`,
      });
    case "other":
      return evaluated({
        severity: "info",
        check: "hooks-active",
        message: `core.hooksPath is ${state.value}, so another hooks tool runs this clone's hooks. Make sure it calls .persist/hooks/pre-commit and pre-push, or switch to Persist's: ${HOOKS_PATH_ACTIVATION_COMMAND}`,
      });
  }
}

/** `CI` is set by GitHub Actions, GitLab CI, CircleCI, Travis, Buildkite and most others. */
function isCi(env: NodeJS.ProcessEnv): boolean {
  const value = env.CI;
  return value !== undefined && value !== "" && value !== "false" && value !== "0";
}

function evaluated(finding: DoctorFinding): HooksActiveCheckResult {
  return { findings: [finding], outcome: { id: "hooks-active", status: "evaluated" } };
}

function notEvaluated(reason: string): HooksActiveCheckResult {
  return { findings: [], outcome: { id: "hooks-active", status: "not-evaluated", reason } };
}
