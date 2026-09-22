import { isPresentDirectory, isPresentFile } from "../../filesystem/present-file.js";
import path from "node:path";

import type { DoctorCheckContext, DoctorFinding } from "../doctor-check.js";

export const CURSOR_RULE_PATH = ".cursor/rules/persist-memory.mdc";

/**
 * Memory entry files derived from config.aiTools. These are load-bearing: without them the
 * agent starts with no memory at all, so a missing one is an error.
 * AGENTS.md is always required. CLAUDE.md only when claude is selected. Codex and generic
 * rely on AGENTS.md, so they add no extra required root file.
 * When aiTools is unknown (no config), require the legacy set so a misconfigured repo fails
 * loudly instead of silently passing.
 */
export function requiredRootFiles(aiTools: readonly string[] | undefined): string[] {
  if (aiTools === undefined) {
    return ["AGENTS.md", "CLAUDE.md"];
  }

  const files = ["AGENTS.md"];

  if (aiTools.includes("claude")) {
    files.push("CLAUDE.md");
  }

  return files;
}

/**
 * Tool files that make memory load automatically but are not load-bearing, so a missing one is
 * a warning rather than an error. Cursor still reads AGENTS.md without its rule file, and teams
 * commonly gitignore `.cursor/` — requiring it would break those repos on upgrade for no gain.
 */
export function advisoryToolFiles(aiTools: readonly string[] | undefined): string[] {
  if (aiTools === undefined) {
    return [];
  }

  return aiTools.includes("cursor") ? [CURSOR_RULE_PATH] : [];
}

/**
 * The minimal required set (ADR-0007): six documents plus the ADR index. Everything else is
 * opt-in — not generated unless asked for, and never an error when absent.
 */
export const requiredDocs = [
  "00-product/PRODUCT.md",
  "20-security/SECURITY_MODEL.md",
  "50-quality/QUALITY_GATES.md",
  "60-engineering/ENGINEERING_STANDARDS.md",
  "60-engineering/CONVENTIONS.md",
  "60-engineering/LESSONS.md",
];

export async function checkRequiredFiles(context: DoctorCheckContext): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  const docsDir = context.config?.docsDir ?? "docs";

  for (const filePath of requiredRootFiles(context.config?.aiTools)) {
    if (!(await isFile(context.rootDir, filePath))) {
      findings.push(missingFile(filePath, "required-files"));
    }
  }

  for (const filePath of advisoryToolFiles(context.config?.aiTools)) {
    if (!(await isFile(context.rootDir, filePath))) {
      findings.push({
        severity: "warning",
        check: "tool-files",
        message:
          'Cursor rule is missing, so memory will not auto-load in Cursor. Restore it with `persist init` — without --force it only adds files that are missing — or drop "cursor" from aiTools.',
        path: filePath,
      });
    }
  }

  for (const relativeDocPath of requiredDocs) {
    const filePath = path.posix.join(docsDir, relativeDocPath);
    if (!(await isFile(context.rootDir, filePath))) {
      findings.push(missingFile(filePath, "required-docs"));
    }
  }

  const adrIndexPath = path.posix.join(context.config?.adrDir ?? "docs/adrs", "README.md");
  if (!(await isFile(context.rootDir, adrIndexPath))) {
    findings.push(missingFile(adrIndexPath, "required-docs"));
  }

  if (context.config !== undefined) {
    // Features and modules are opt-in: their directories are created on demand by
    // `feature create` / `module create`, so absence is never an error.
    const requiredDirectories = [context.config.docsDir, context.config.adrDir];

    for (const directoryPath of requiredDirectories) {
      if (!(await isDirectory(context.rootDir, directoryPath))) {
        findings.push({
          severity: "error",
          check: "configured-directories",
          message: "Configured directory is missing.",
          path: directoryPath,
        });
      }
    }
  }

  return findings;
}

async function isFile(rootDir: string, relativePath: string): Promise<boolean> {
  // Follows a symlink that stays inside the repository (CLAUDE.md → AGENTS.md is common).
  return isPresentFile(rootDir, relativePath);
}

async function isDirectory(rootDir: string, relativePath: string): Promise<boolean> {
  return isPresentDirectory(rootDir, relativePath);
}

function missingFile(pathValue: string, check: string): DoctorFinding {
  return {
    severity: "error",
    check,
    message: "Required file is missing.",
    path: pathValue,
  };
}
