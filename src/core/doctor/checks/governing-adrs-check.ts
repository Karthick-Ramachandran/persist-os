import { adrGoverns, readGoverningAdrs } from "../../adr/governing-adrs.js";
import { NO_UPSTREAM_REASON, readChangeSet } from "../change-set.js";
import type { DoctorCheckContext, DoctorCheckOutcome, DoctorFinding } from "../doctor-check.js";

export type GoverningAdrsCheckResult = {
  findings: DoctorFinding[];
  outcome: DoctorCheckOutcome;
};

/**
 * Name the accepted ADRs that govern what this change touches, with the decision itself.
 *
 * A session only sees ADR titles, and an agent that never opens the body can follow the title
 * and still break the rule inside it. This puts the decision in front of the agent and the
 * reviewer at commit time, for exactly the files the ADR says it governs (`## Applies To`).
 * It reports, it does not judge: whether the diff follows the decision is the adr-compliance
 * skill's job, so the finding is info, never a warning.
 */
export async function checkGoverningAdrs(
  context: DoctorCheckContext,
): Promise<GoverningAdrsCheckResult> {
  if (context.config === undefined) {
    return notEvaluated("no validated Persist OS config, so the ADR directory is unknown");
  }

  const adrs = await readGoverningAdrs(context.rootDir, context.config.adrDir);
  if (adrs.length === 0) {
    return notEvaluated(
      "no accepted ADR lists the paths it governs (an Applies To section), so no change can be matched to a decision",
    );
  }

  const change = await readChangeSet(context.rootDir);
  if (change.kind === "not-git") {
    return notEvaluated("not inside a git work tree, so the change is unknown");
  }
  if (change.kind === "no-upstream") {
    return notEvaluated(NO_UPSTREAM_REASON);
  }

  const findings: DoctorFinding[] = [];
  for (const adr of adrs) {
    const touched = change.paths.filter((file) => adrGoverns(adr, file));
    if (touched.length === 0) {
      continue;
    }

    const shown =
      touched.slice(0, 5).join(", ") +
      (touched.length > 5 ? `, and ${touched.length - 5} more` : "");
    findings.push({
      severity: "info",
      check: "governing-adrs",
      message:
        `${change.kind === "unpushed" ? "Unpushed changes" : "Changes"} to ${shown} fall under ${adr.id} (${adr.title}): ` +
        `${adr.decision} Check the diff against its Decision before calling the work done (the adr-compliance skill walks through it).`,
      path: adr.file,
    });
  }

  return { findings, outcome: { id: "governing-adrs", status: "evaluated" } };
}

function notEvaluated(reason: string): GoverningAdrsCheckResult {
  return { findings: [], outcome: { id: "governing-adrs", status: "not-evaluated", reason } };
}
