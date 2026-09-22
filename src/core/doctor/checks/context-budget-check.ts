import { readFile, realpath } from "node:fs/promises";
import path from "node:path";

import { FENCES_FILE } from "../../fence/generate-fence.js";
import {
  ALWAYS_LOADED_BUDGET_BYTES,
  FENCE_INDEX_LABEL,
  SESSION_START_BASE_CONTEXT,
} from "../../hooks/generate-hook.js";
import type { DoctorCheckContext, DoctorFinding } from "../doctor-check.js";

// Files an AI tool loads into context every session (auto-loaded, not on-demand). Whichever exist for
// the repo's selected tools count toward the budget.
const ALWAYS_LOADED = ["CLAUDE.md", "AGENTS.md", ".cursor/rules/persist-memory.mdc"];

// Generous ceiling: a fresh repo's always-loaded set is a few KB, so real repos never trip this; it
// only fires when the per-session memory has bloated, which buries the signal and wastes the budget.
const BUDGET_BYTES = ALWAYS_LOADED_BUDGET_BYTES;

/**
 * Deterministic, local, read-only context-budget check. Memory only helps if it stays an index the
 * agent reads on demand, not a wall of text loaded every session. This warns when the always-loaded
 * agent files grow past a budget, so the memory stays a map, not a dump.
 *
 * The SessionStart hook's fence index counts too: it injects the flattened `## ` / `Why: ` lines
 * of FENCES.md into every session, truncated to whatever room the agent files and base context
 * leave. Truncation keeps runtime inside budget, which also hid the growth — without measuring
 * the index, fences could outgrow what fits and nobody would learn it. So this warns when the
 * full index no longer fits its share, naming the truncation the hook is already doing.
 */
export async function checkContextBudget(context: DoctorCheckContext): Promise<DoctorFinding[]> {
  if (context.config === undefined) {
    return [];
  }

  let total = 0;
  // A repository that links CLAUDE.md to AGENTS.md loads that text once, so count each real
  // file once rather than once per name.
  const counted = new Set<string>();
  for (const relativePath of ALWAYS_LOADED) {
    const real = await realPathIfExists(path.join(context.rootDir, relativePath));
    if (real === undefined || counted.has(real)) {
      continue;
    }
    counted.add(real);
    const content = await readFileIfExists(context.rootDir, relativePath);
    if (content !== undefined) {
      total += Buffer.byteLength(content, "utf8");
    }
  }

  const findings: DoctorFinding[] = [];

  if (total > BUDGET_BYTES) {
    findings.push({
      severity: "warning",
      check: "context-budget",
      message: `The always-loaded agent files total ${formatKb(total)} (over the ${formatKb(
        BUDGET_BYTES,
      )} budget) — trim them or move detail into on-demand docs so every session stays lean.`,
    });
  }

  findings.push(...(await checkFenceIndexShare(context, total)));

  return findings;
}

/**
 * The fence index's share of the budget, computed exactly the way the hook computes it: the
 * flattened index lines, against the budget minus the agent files minus the base context minus
 * the index label. A missing FENCES.md injects nothing, so there is nothing to measure.
 */
async function checkFenceIndexShare(
  context: DoctorCheckContext,
  agentBytes: number,
): Promise<DoctorFinding[]> {
  const fencesPath = path.posix.join(context.config?.docsDir ?? "", FENCES_FILE);
  const fences = await readFileIfExists(context.rootDir, fencesPath);
  if (fences === undefined) {
    return [];
  }

  const index = flattenFenceIndex(fences);
  if (index === "") {
    return [];
  }

  const indexBytes = Buffer.byteLength(index, "utf8");
  const room =
    BUDGET_BYTES -
    agentBytes -
    Buffer.byteLength(SESSION_START_BASE_CONTEXT, "utf8") -
    Buffer.byteLength(FENCE_INDEX_LABEL, "utf8");

  if (indexBytes <= room) {
    return [];
  }

  return [
    {
      severity: "warning",
      check: "context-budget",
      message:
        `The fence index (${formatKb(indexBytes)} of recorded reasons) no longer fits its ` +
        `${formatKb(Math.max(room, 0))} share of the always-loaded budget — the SessionStart hook ` +
        `truncates it, so some reasons never load into sessions. Shorten Why: lines or remove ` +
        `stale fences so the whole index fits.`,
      path: fencesPath,
    },
  ];
}

/**
 * The `full` variable in the SessionStart hook: `## ` and `Why: ` lines flattened to one line,
 * each trailing newline become a space. Mirrored here so the measured size is the injected size.
 */
function flattenFenceIndex(fences: string): string {
  const lines = fences
    .split("\n")
    .filter((line) => line.startsWith("## ") || line.startsWith("Why: "));
  return lines.length === 0 ? "" : `${lines.join(" ")} `;
}

function formatKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function readFileIfExists(
  rootDir: string,
  relativePath: string,
): Promise<string | undefined> {
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

async function realPathIfExists(fullPath: string): Promise<string | undefined> {
  try {
    return await realpath(fullPath);
  } catch {
    return undefined;
  }
}
