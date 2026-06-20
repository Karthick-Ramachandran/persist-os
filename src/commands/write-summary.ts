import type { WriteResult } from "../core/filesystem/write-file-safe.js";

export type WriteSummaryOptions = {
  dryRun: boolean;
  writeResult: WriteResult;
};

export function appendWriteSummary(
  lines: string[],
  options: WriteSummaryOptions
): void {
  appendFileList(
    lines,
    options.dryRun ? "Planned creates" : "Created",
    options.writeResult.created
  );
  appendFileList(
    lines,
    options.dryRun ? "Planned overwrites" : "Overwritten",
    options.writeResult.overwritten
  );
  appendFileList(lines, "Skipped", options.writeResult.skipped);
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
