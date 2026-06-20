import { existsSync } from "node:fs";

import type { ConflictPolicy } from "./conflict-policy.js";
import { shouldOverwriteExisting } from "./conflict-policy.js";
import { resolveSafePath } from "./safe-path.js";

export type WriteFileInput = {
  path: string;
  content: string;
};

export type WritePlanCreateEntry = {
  action: "create";
  path: string;
  absolutePath: string;
  content: string;
};

export type WritePlanSkipEntry = {
  action: "skip";
  path: string;
  absolutePath: string;
  reason: string;
};

export type WritePlanOverwriteEntry = {
  action: "overwrite";
  path: string;
  absolutePath: string;
  content: string;
};

export type WritePlanErrorEntry = {
  action: "error";
  path: string;
  reason: string;
};

export type WritePlanEntry =
  | WritePlanCreateEntry
  | WritePlanSkipEntry
  | WritePlanOverwriteEntry
  | WritePlanErrorEntry;

export type WritePlan = {
  entries: WritePlanEntry[];
  hasErrors: boolean;
};

export type CreateWritePlanOptions = {
  rootDir: string;
  files: WriteFileInput[];
  policy?: ConflictPolicy;
  force?: boolean;
};

export function createWritePlan(options: CreateWritePlanOptions): WritePlan {
  const policy = options.policy ?? (options.force ? "overwrite" : "skip-existing");
  const seen = new Map<string, string>();
  const entries: WritePlanEntry[] = [];

  for (const file of options.files) {
    try {
      const safePath = resolveSafePath(options.rootDir, file.path);
      const existingPath = seen.get(safePath.path);

      if (existingPath !== undefined) {
        entries.push({
          action: "error",
          path: file.path,
          reason: `Duplicate output path "${safePath.path}" also used by "${existingPath}".`
        });
        continue;
      }

      seen.set(safePath.path, file.path);

      if (existsSync(safePath.absolutePath)) {
        if (shouldOverwriteExisting(policy)) {
          entries.push({
            action: "overwrite",
            path: safePath.path,
            absolutePath: safePath.absolutePath,
            content: file.content
          });
        } else {
          entries.push({
            action: "skip",
            path: safePath.path,
            absolutePath: safePath.absolutePath,
            reason: "File already exists."
          });
        }
        continue;
      }

      entries.push({
        action: "create",
        path: safePath.path,
        absolutePath: safePath.absolutePath,
        content: file.content
      });
    } catch (error) {
      entries.push({
        action: "error",
        path: file.path,
        reason: error instanceof Error ? error.message : "Invalid output path."
      });
    }
  }

  return {
    entries,
    hasErrors: entries.some((entry) => entry.action === "error")
  };
}
