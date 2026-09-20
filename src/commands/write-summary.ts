import { getStyle } from "../cli/style.js";
import type { WriteResult } from "../core/filesystem/write-file-safe.js";

export type WriteSummaryOptions = {
  dryRun: boolean;
  writeResult: WriteResult;
};

export function appendWriteSummary(lines: string[], options: WriteSummaryOptions): void {
  const style = getStyle();

  appendFileList(
    lines,
    options.dryRun ? "Planned creates" : "Created",
    options.writeResult.created,
    style.ok,
  );
  appendFileList(
    lines,
    options.dryRun ? "Planned overwrites" : "Overwritten",
    options.writeResult.overwritten,
    style.warn,
  );
  appendFileList(lines, "Skipped", options.writeResult.skipped, style.muted);
}

/**
 * Append a "Next steps" guidance block so the CLI tells the user what each artifact is for and what
 * to do next, instead of only listing created paths. Commands inside backticks are highlighted;
 * the words carry the meaning either way.
 */
export function appendNextSteps(lines: string[], steps: string[]): void {
  if (steps.length === 0) {
    return;
  }

  const style = getStyle();

  lines.push("");
  lines.push("Next steps:");
  for (const step of steps) {
    lines.push(`- ${step.replace(/`([^`]+)`/gu, (_, code: string) => style.accent(code))}`);
  }
}

function appendFileList(
  lines: string[],
  label: string,
  paths: string[],
  color: (text: string) => string,
): void {
  if (paths.length === 0) {
    return;
  }

  lines.push(`${label}:`);
  for (const filePath of paths) {
    lines.push(`- ${color(filePath)}`);
  }
}
