import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { ConfigValidationError } from "../../core/config/config-schema.js";
import { loadConfig, ConfigLoadError } from "../../core/config/load-config.js";
import { resolveSafePath } from "../../core/filesystem/safe-path.js";
import { createWritePlan, type WritePlan } from "../../core/filesystem/write-plan.js";
import { executeWritePlan, type WriteResult } from "../../core/filesystem/write-file-safe.js";
import { generateSupersedingAdr } from "../../core/generator/generate-adr.js";
import { getNextAdrNumber } from "../../core/naming/adr-number.js";
import { SlugifyError, slugify } from "../../core/naming/slugify.js";
import { appendNextSteps, appendWriteSummary } from "../write-summary.js";

export type AdrSupersedeOptions = {
  rootDir: string;
  oldName: string;
  newTitle: string;
  dryRun?: boolean;
  force?: boolean;
};

export type AdrSupersedeResult = {
  oldRef: string;
  oldPath: string;
  newRef: string;
  newPath: string;
  dryRun: boolean;
  writeResult: WriteResult;
};

export type AdrSupersedeErrorCode =
  | "CONFIG_REQUIRED"
  | "INVALID_ADR_NAME"
  | "NOT_FOUND"
  | "NOT_ACCEPTED"
  | "WRITE_PLAN_ERROR";

export class AdrSupersedeError extends Error {
  readonly code: AdrSupersedeErrorCode;
  readonly details: string[];

  constructor(code: AdrSupersedeErrorCode, message: string, details: string[] = []) {
    super(message);
    this.name = "AdrSupersedeError";
    this.code = code;
    this.details = details;
  }
}

export async function supersedeAdr(options: AdrSupersedeOptions): Promise<AdrSupersedeResult> {
  const oldSlug = createSlug(options.oldName, "oldName");
  // Validate the new title is sluggable, with a clean error before any file work.
  createSlug(options.newTitle, "newTitle");
  const config = await loadRequiredConfig(options.rootDir);
  const adrDirAbsolute = resolveSafePath(options.rootDir, config.adrDir).absolutePath;

  const old = await findAcceptedAdr(adrDirAbsolute, oldSlug);
  const next = await getNextAdrNumber(adrDirAbsolute);
  const oldRef = old.fileName.replace(/\.md$/u, "");

  // The new, accepted decision that records why the old one changed.
  const superseding = generateSupersedingAdr({
    adrDir: config.adrDir,
    adrId: next.id,
    title: options.newTitle,
    supersedesRef: oldRef,
  });
  const newRef = `${next.id}-${superseding.slug}`;

  // Mark the old ADR superseded, but keep "Accepted" in the status so existing drift checks still
  // treat references to it as a real, once-accepted decision — the new superseded-reference check is
  // what flags those references for review.
  const markedOld = old.content.replace(
    /(##\s+Status\r?\n\r?\n)Accepted[^\n]*/u,
    `$1Accepted — superseded by ${newRef}`,
  );

  const writeNew = await write(options, superseding.path, superseding.content, options.force);
  const oldRelative = `${config.adrDir}/${old.fileName}`;
  const writeOld = await write(options, oldRelative, markedOld, true);

  return {
    oldRef,
    oldPath: oldRelative,
    newRef,
    newPath: superseding.path,
    dryRun: options.dryRun ?? false,
    writeResult: {
      created: [...writeNew.created, ...writeOld.created],
      overwritten: [...writeNew.overwritten, ...writeOld.overwritten],
      skipped: [...writeNew.skipped, ...writeOld.skipped],
      dryRun: options.dryRun ?? false,
    },
  };
}

async function findAcceptedAdr(
  adrDirAbsolute: string,
  slug: string,
): Promise<{ fileName: string; content: string }> {
  const pattern = new RegExp(`^ADR-\\d{4,}-${escapeRegExp(slug)}\\.md$`, "u");

  let entries;
  try {
    entries = await readdir(adrDirAbsolute, { withFileTypes: true });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      throw new AdrSupersedeError("NOT_FOUND", `No accepted ADR found for "${slug}".`);
    }
    throw error;
  }

  const match = entries.find((entry) => entry.isFile() && pattern.test(entry.name));
  if (match === undefined) {
    throw new AdrSupersedeError("NOT_FOUND", `No accepted ADR found for "${slug}".`, [
      `Looked for an ADR-####-${slug}.md in the ADR directory.`,
    ]);
  }

  const content = await readFile(path.join(adrDirAbsolute, match.name), "utf8");
  if (!/(##\s+Status\r?\n\r?\n)Accepted\b/u.test(content)) {
    throw new AdrSupersedeError(
      "NOT_ACCEPTED",
      `ADR ${match.name} is not Accepted, so there is nothing to supersede.`,
      ["Only an accepted decision can be superseded. Accept it first with `recall adr accept`."],
    );
  }

  return { fileName: match.name, content };
}

async function write(
  options: AdrSupersedeOptions,
  relativePath: string,
  content: string,
  force: boolean | undefined,
): Promise<WriteResult> {
  const plan = createWritePlan({
    rootDir: options.rootDir,
    files: [{ path: relativePath, content }],
    force,
  });

  if (plan.hasErrors) {
    throw new AdrSupersedeError(
      "WRITE_PLAN_ERROR",
      "ADR supersede write plan contains errors.",
      plan.entries
        .filter(
          (entry): entry is Extract<WritePlan["entries"][number], { action: "error" }> =>
            entry.action === "error",
        )
        .map((entry) => `${entry.path}: ${entry.reason}`),
    );
  }

  return executeWritePlan(plan, { dryRun: options.dryRun });
}

export function formatAdrSupersedeResult(result: AdrSupersedeResult): string {
  const lines = [
    result.dryRun
      ? "Recall OS ADR supersede dry run complete."
      : "Recall OS ADR supersede complete.",
    `Superseded: ${result.oldPath} (now marked superseded by ${result.newRef})`,
    `New decision: ${result.newPath}`,
  ];

  appendWriteSummary(lines, { dryRun: result.dryRun, writeResult: result.writeResult });

  if (!result.dryRun) {
    appendNextSteps(lines, [
      `Fill ${result.newPath}: Context (what changed), Decision, Alternatives, Consequences.`,
      `${result.oldRef} stays in history as superseded; update any memory that still relies on it.`,
      "Run `recall doctor` — it flags memory that still references the superseded decision.",
    ]);
  }

  return `${lines.join("\n")}\n`;
}

function createSlug(name: string, field: "oldName" | "newTitle"): string {
  const withoutPrefix = name.replace(/^ADR-(?:PROPOSED-|\d{4,}-)/iu, "");
  try {
    return slugify(withoutPrefix);
  } catch (error) {
    if (error instanceof SlugifyError) {
      throw new AdrSupersedeError("INVALID_ADR_NAME", `Invalid ${field}: ${error.message}`);
    }
    throw error;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

async function loadRequiredConfig(rootDir: string) {
  try {
    return await loadConfig(rootDir);
  } catch (error) {
    if (error instanceof ConfigLoadError || error instanceof ConfigValidationError) {
      throw new AdrSupersedeError(
        "CONFIG_REQUIRED",
        "Recall OS config not found or invalid. Run `recall init` first.",
        [error.message],
      );
    }
    throw error;
  }
}
