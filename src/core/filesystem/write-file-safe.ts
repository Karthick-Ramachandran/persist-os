import { mkdir, writeFile, lstat } from "node:fs/promises";
import path from "node:path";

import type {
  WritePlan,
  WritePlanCreateEntry,
  WritePlanEntry,
  WritePlanOverwriteEntry
} from "./write-plan.js";

export type WriteResult = {
  created: string[];
  overwritten: string[];
  skipped: string[];
  dryRun: boolean;
};

export class WriteSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WriteSafetyError";
  }
}

export type ExecuteWritePlanOptions = {
  dryRun?: boolean;
};

export async function executeWritePlan(
  plan: WritePlan,
  options: ExecuteWritePlanOptions = {}
): Promise<WriteResult> {
  if (plan.hasErrors) {
    throw new WriteSafetyError("Refusing to execute a write plan with errors.");
  }

  const result: WriteResult = {
    created: [],
    overwritten: [],
    skipped: [],
    dryRun: options.dryRun ?? false
  };

  for (const entry of plan.entries) {
    if (entry.action === "skip") {
      result.skipped.push(entry.path);
      continue;
    }

    if (entry.action !== "create" && entry.action !== "overwrite") {
      continue;
    }

    if (result.dryRun) {
      if (entry.action === "create") {
        result.created.push(entry.path);
      } else {
        result.overwritten.push(entry.path);
      }
      continue;
    }

    await writeFileSafe(entry);

    if (entry.action === "create") {
      result.created.push(entry.path);
    } else {
      result.overwritten.push(entry.path);
    }
  }

  return result;
}

export async function writeFileSafe(
  entry: WritePlanCreateEntry | WritePlanOverwriteEntry
): Promise<void> {
  await assertNoSymlinkInExistingPath(entry.absolutePath);
  await mkdir(path.dirname(entry.absolutePath), { recursive: true });
  await writeFile(entry.absolutePath, entry.content, {
    encoding: "utf8",
    flag: entry.action === "create" ? "wx" : "w"
  });
}

async function assertNoSymlinkInExistingPath(absolutePath: string): Promise<void> {
  const segments = path.resolve(absolutePath).split(path.sep);
  let current = segments[0] === "" ? path.sep : segments[0];
  const startIndex = segments[0] === "" ? 1 : 1;

  for (let index = startIndex; index < segments.length; index += 1) {
    current = current === path.sep ? path.join(current, segments[index] ?? "") : path.join(current, segments[index] ?? "");

    try {
      const stats = await lstat(current);
      if (stats.isSymbolicLink()) {
        throw new WriteSafetyError(`Refusing to write through symlink: ${current}`);
      }
    } catch (error) {
      if (error instanceof WriteSafetyError) {
        throw error;
      }

      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === "ENOENT") {
        return;
      }

      throw error;
    }
  }
}

export function assertExecutableEntry(
  entry: WritePlanEntry
): asserts entry is WritePlanCreateEntry | WritePlanOverwriteEntry {
  if (entry.action !== "create" && entry.action !== "overwrite") {
    throw new WriteSafetyError(`Entry action "${entry.action}" is not executable.`);
  }
}
