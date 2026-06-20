import type { WriteResult } from "../core/filesystem/write-file-safe.js";

export type WriteSummaryOptions = {
  dryRun: boolean;
  writeResult: WriteResult;
};

export function appendWriteSummary(lines: string[], options: WriteSummaryOptions): void {
  appendFileList(
    lines,
    options.dryRun ? "Planned creates" : "Created",
    options.writeResult.created,
  );
  appendFileList(
    lines,
    options.dryRun ? "Planned overwrites" : "Overwritten",
    options.writeResult.overwritten,
  );
  appendFileList(lines, "Skipped", options.writeResult.skipped);
}

/**
 * Append a "Next steps" guidance block so the CLI tells the user what each artifact is for and what
 * to do next, instead of only listing created paths.
 */
export function appendNextSteps(lines: string[], steps: string[]): void {
  if (steps.length === 0) {
    return;
  }

  lines.push("");
  lines.push("Next steps:");
  for (const step of steps) {
    lines.push(`- ${step}`);
  }
}

function appendFileList(lines: string[], label: string, paths: string[]): void {
  if (paths.length === 0) {
    return;
  }

  lines.push(`${label}:`);
  for (const filePath of paths) {
    lines.push(`- ${filePath}`);
  }
}
