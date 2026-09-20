import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import { listCatalogSkillNames } from "../../skills/skill-catalog.js";
import type { DoctorCheckContext, DoctorCheckOutcome, DoctorFinding } from "../doctor-check.js";

const SKILL_DIRS = [".claude/skills", ".agents/skills"] as const;

export type RetiredSkillsCheckResult = {
  findings: DoctorFinding[];
  outcome: DoctorCheckOutcome;
};

/**
 * Migration-loosening check (ADR-0007): report on-disk skills that are no longer in the
 * built-in catalog. The catalog is the only history available, so a non-catalog skill is
 * either retired or hand-made — the message says so, names it, and gives the removal command,
 * and the user decides when to delete. Warning, never error: custom skills are legitimate.
 * Skills directories are generated output, not config, so absent directories mean a clean
 * repo and evaluate quietly.
 */
export async function checkRetiredSkills(
  context: DoctorCheckContext,
): Promise<RetiredSkillsCheckResult> {
  const catalog = new Set(listCatalogSkillNames());
  const findings: DoctorFinding[] = [];

  for (const skillsDir of SKILL_DIRS) {
    for (const name of await listSkillNames(context.rootDir, skillsDir)) {
      if (!catalog.has(name)) {
        findings.push({
          severity: "warning",
          check: "retired-skills",
          message: `Skill "${name}" is not in the built-in skill catalog (a retired skill or a hand-made custom skill). If retired, remove it with \`rm -rf ${skillsDir}/${name}\`; leave custom skills in place.`,
          path: `${skillsDir}/${name}/SKILL.md`,
        });
      }
    }
  }

  return { findings, outcome: { id: "retired-skills", status: "evaluated" } };
}

async function listSkillNames(rootDir: string, skillsDir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(path.join(rootDir, skillsDir), { withFileTypes: true });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return [];
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
