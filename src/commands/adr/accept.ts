import { existsSync } from "node:fs";
import { readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";

import { ConfigValidationError } from "../../core/config/config-schema.js";
import { loadConfig, ConfigLoadError } from "../../core/config/load-config.js";
import { resolveSafePath } from "../../core/filesystem/safe-path.js";
import { createWritePlan, type WritePlan } from "../../core/filesystem/write-plan.js";
import { executeWritePlan, type WriteResult } from "../../core/filesystem/write-file-safe.js";
import { getNextAdrNumber } from "../../core/naming/adr-number.js";
import { SlugifyError, slugify } from "../../core/naming/slugify.js";
import { getStyle } from "../../cli/style.js";
import { appendNextSteps, appendWriteSummary } from "../write-summary.js";

export type AdrAcceptOptions = {
  rootDir: string;
  name: string;
  dryRun?: boolean;
  force?: boolean;
};

export type AdrAcceptResult = {
  slug: string;
  acceptedPath: string;
  source: "proposed" | "in-place";
  proposedRemoved: string | null;
  dryRun: boolean;
  writeResult: WriteResult;
};

export type AdrAcceptErrorCode =
  | "CONFIG_REQUIRED"
  | "INVALID_ADR_NAME"
  | "NOT_FOUND"
  | "WRITE_PLAN_ERROR";

export class AdrAcceptError extends Error {
  readonly code: AdrAcceptErrorCode;
  readonly details: string[];

  constructor(code: AdrAcceptErrorCode, message: string, details: string[] = []) {
    super(message);
    this.name = "AdrAcceptError";
    this.code = code;
    this.details = details;
  }
}

export async function acceptAdr(options: AdrAcceptOptions): Promise<AdrAcceptResult> {
  const slug = createSlug(options.name);
  const config = await loadRequiredConfig(options.rootDir);
  const adrDirAbsolute = resolveSafePath(options.rootDir, config.adrDir).absolutePath;

  const proposedRelative = `${config.adrDir}/proposed/ADR-PROPOSED-${slug}.md`;
  const proposedAbsolute = resolveSafePath(options.rootDir, proposedRelative).absolutePath;

  if (existsSync(proposedAbsolute)) {
    return promoteProposed(
      options,
      config.adrDir,
      adrDirAbsolute,
      proposedRelative,
      proposedAbsolute,
      slug,
    );
  }

  const numbered = await findNumberedAdr(adrDirAbsolute, slug);
  if (numbered !== null) {
    return acceptInPlace(options, config.adrDir, numbered);
  }

  throw new AdrAcceptError("NOT_FOUND", `No proposed ADR found for "${slug}".`, [
    `Looked for ${proposedRelative} and a Proposed ADR matching the slug in ${config.adrDir}.`,
  ]);
}

async function promoteProposed(
  options: AdrAcceptOptions,
  adrDir: string,
  adrDirAbsolute: string,
  proposedRelative: string,
  proposedAbsolute: string,
  slug: string,
): Promise<AdrAcceptResult> {
  const content = await readFile(proposedAbsolute, "utf8");
  const next = await getNextAdrNumber(adrDirAbsolute);
  const acceptedRelative = `${adrDir}/${next.id}-${slug}.md`;
  const accepted = renderAccepted(content, next.id);

  const writeResult = await write(options, acceptedRelative, accepted);

  let proposedRemoved: string | null = null;
  if (!options.dryRun) {
    await rm(proposedAbsolute);
    proposedRemoved = proposedRelative;
  }

  return {
    slug,
    acceptedPath: acceptedRelative,
    source: "proposed",
    proposedRemoved,
    dryRun: options.dryRun ?? false,
    writeResult,
  };
}

async function acceptInPlace(
  options: AdrAcceptOptions,
  adrDir: string,
  numbered: { fileName: string; content: string },
): Promise<AdrAcceptResult> {
  const relativePath = `${adrDir}/${numbered.fileName}`;
  const accepted = renderAccepted(numbered.content, null);

  // The file already exists; promotion is an explicit accept, so overwrite it in place.
  const writeResult = await write({ ...options, force: true }, relativePath, accepted);

  return {
    slug: numbered.fileName,
    acceptedPath: relativePath,
    source: "in-place",
    proposedRemoved: null,
    dryRun: options.dryRun ?? false,
    writeResult,
  };
}

async function write(
  options: AdrAcceptOptions,
  relativePath: string,
  content: string,
): Promise<WriteResult> {
  const plan = createWritePlan({
    rootDir: options.rootDir,
    files: [{ path: relativePath, content }],
    force: options.force,
  });

  if (plan.hasErrors) {
    throw new AdrAcceptError(
      "WRITE_PLAN_ERROR",
      "ADR accept write plan contains errors.",
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

function renderAccepted(content: string, id: string | null): string {
  let out = content.replace(/(##\s+Status\r?\n\r?\n)Proposed\b/u, "$1Accepted");

  if (id !== null) {
    out = out.replace(/^# Proposed ADR: (.+)$/mu, `# ${id}: $1`);
  }

  return out;
}

async function findNumberedAdr(
  adrDirAbsolute: string,
  slug: string,
): Promise<{ fileName: string; content: string } | null> {
  const pattern = new RegExp(`^ADR-\\d{4,}-${escapeRegExp(slug)}\\.md$`, "u");

  let entries;
  try {
    entries = await readdir(adrDirAbsolute, { withFileTypes: true });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return null;
    }
    throw error;
  }

  const match = entries.find((entry) => entry.isFile() && pattern.test(entry.name));
  if (match === undefined) {
    return null;
  }

  const content = await readFile(path.join(adrDirAbsolute, match.name), "utf8");
  if (!/(##\s+Status\r?\n\r?\n)Proposed\b/u.test(content)) {
    throw new AdrAcceptError("NOT_FOUND", `ADR ${match.name} is not Proposed.`);
  }

  return { fileName: match.name, content };
}

export function formatAdrAcceptResult(result: AdrAcceptResult): string {
  const lines = [
    getStyle().heading(
      result.dryRun ? "Persist OS ADR accept dry run complete." : "Persist OS ADR accept complete.",
    ),
    `Accepted: ${result.acceptedPath}`,
  ];

  appendWriteSummary(lines, { dryRun: result.dryRun, writeResult: result.writeResult });

  if (result.proposedRemoved !== null) {
    lines.push(`Removed proposal: ${result.proposedRemoved}`);
  }

  if (!result.dryRun) {
    appendNextSteps(lines, [
      `${result.acceptedPath} is now Accepted and is repository source of truth.`,
      "Drift checks now treat references to it as resolved.",
    ]);
  }

  return `${lines.join("\n")}\n`;
}

function createSlug(name: string): string {
  // Accept the bare slug, the proposed filename (ADR-PROPOSED-<slug>), or the accepted
  // filename (ADR-####-<slug>), with or without a trailing `.md`. All resolve to the slug.
  const withoutPrefix = name
    .replace(/\.md$/iu, "")
    .replace(/^ADR-PROPOSED-/iu, "")
    .replace(/^ADR-\d{3,}-/iu, "");
  try {
    return slugify(withoutPrefix);
  } catch (error) {
    if (error instanceof SlugifyError) {
      throw new AdrAcceptError("INVALID_ADR_NAME", error.message);
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
      throw new AdrAcceptError(
        "CONFIG_REQUIRED",
        "Persist OS config not found or invalid. Run `persist init` first.",
        [error.message],
      );
    }
    throw error;
  }
}
