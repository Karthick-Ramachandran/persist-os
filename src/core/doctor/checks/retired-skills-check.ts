import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import type { DoctorCheckContext, DoctorCheckOutcome, DoctorFinding } from "../doctor-check.js";

const SKILL_DIRS = [".claude/skills", ".agents/skills"] as const;

/**
 * Skills retired in 1.0 (ADR-0007) that stayed retired in 1.4.0 (ADR-0016), each with the
 * skill that absorbed its job. Names 1.4.0 brought back (`implement-task`, `write-tests`,
 * `create-adr`, `completion-report`) are catalog skills again and stay silent; so does
 * `capture-mcp-context`, which `persist mcp add` still generates. Warn only on these
 * explicit names: "not in the catalog" conflates a skill we retired with a skill the user
 * wrote, and a gate that permanently complains about `skill create` — a supported
 * workflow — stops being read. Anything on disk but not on this list is custom and stays
 * silent. Append here when a future release retires more; do not build a migration
 * framework for it.
 */
export const RETIRED_SKILL_NAMES: ReadonlySet<string> = new Set([
  "create-prd",
  "plan-module",
  "update-module-memory",
  "architecture-drift-review",
]);

/** Where each still-retired skill's substance went, named in the warning. */
export const RETIRED_SKILL_REPLACEMENTS: ReadonlyMap<string, string> = new Map([
  ["create-prd", "plan-feature"],
  ["plan-module", "module-memory"],
  ["update-module-memory", "module-memory"],
  ["architecture-drift-review", "drift-review"],
]);

export type RetiredSkillsCheckResult = {
  findings: DoctorFinding[];
  outcome: DoctorCheckOutcome;
};

/**
 * Migration-loosening check (ADR-0007): report on-disk skills we retired. The message knows
 * the skill is retired, so it says so and gives the removal command without hedging. Warning,
 * never error: the user decides when to delete. When neither skills directory exists there is
 * nothing to compare, so the check reports not-evaluated instead of passing.
 */
export async function checkRetiredSkills(
  context: DoctorCheckContext,
): Promise<RetiredSkillsCheckResult> {
  const findings: DoctorFinding[] = [];
  let sawDirectory = false;

  for (const skillsDir of SKILL_DIRS) {
    const names = await listSkillNames(context.rootDir, skillsDir);
    if (names !== null) {
      sawDirectory = true;
      for (const name of names) {
        if (RETIRED_SKILL_NAMES.has(name)) {
          const replacement = RETIRED_SKILL_REPLACEMENTS.get(name);
          findings.push({
            severity: "warning",
            check: "retired-skills",
            message:
              `Skill "${name}" was retired in 1.0` +
              (replacement === undefined ? "" : ` — its job moved to "${replacement}"`) +
              ` — remove it with \`rm -rf ${skillsDir}/${name}\`.`,
            path: `${skillsDir}/${name}/SKILL.md`,
          });
        }
      }
    }
  }

  if (!sawDirectory) {
    return {
      findings,
      outcome: {
        id: "retired-skills",
        status: "not-evaluated",
        reason:
          "no skills directories exist, so retired-skill detection cannot run — run `persist init` to generate skills",
      },
    };
  }

  return { findings, outcome: { id: "retired-skills", status: "evaluated" } };
}

async function listSkillNames(rootDir: string, skillsDir: string): Promise<string[] | null> {
  let entries;
  try {
    entries = await readdir(path.join(rootDir, skillsDir), { withFileTypes: true });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return null;
    }
    throw error;
  }

  const names: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    if (await hasSkillFile(rootDir, skillsDir, entry.name)) {
      names.push(entry.name);
    }
  }
  return names.sort((left, right) => left.localeCompare(right));
}

async function hasSkillFile(rootDir: string, skillsDir: string, name: string): Promise<boolean> {
  try {
    return (await stat(path.join(rootDir, skillsDir, name, "SKILL.md"))).isFile();
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
