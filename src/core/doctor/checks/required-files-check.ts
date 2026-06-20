import { lstat } from "node:fs/promises";
import path from "node:path";

import type { DoctorCheckContext, DoctorFinding } from "../doctor-check.js";

const rootFiles = ["AGENTS.md", "CLAUDE.md"];

const requiredDocs = [
  "00-product/PRD.md",
  "00-product/BRD.md",
  "10-architecture/ARCHITECTURE.md",
  "10-architecture/MEMORY_ENGINE.md",
  "10-architecture/FILE_WRITE_POLICY.md",
  "20-security/SECURITY_MODEL.md",
  "20-security/THREAT_MODEL.md",
  "50-quality/TESTING_STRATEGY.md",
  "50-quality/QUALITY_GATES.md",
  "60-engineering/ENGINEERING_STANDARDS.md",
  "60-engineering/AI_AGENT_RULES.md",
  "ai/AI_AGENTS_SKILLS_MCP_STRATEGY.md",
  "ai/MCP_STRATEGY.md",
  "ai/SPECFORGE_COMMANDS.md"
];

export async function checkRequiredFiles(
  context: DoctorCheckContext
): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  const docsDir = context.config?.docsDir ?? "docs";

  for (const filePath of rootFiles) {
    if (!(await isFile(context.rootDir, filePath))) {
      findings.push(missingFile(filePath, "required-files"));
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
    const requiredDirectories = [
      context.config.docsDir,
      context.config.featuresDir,
      context.config.modulesDir,
      context.config.adrDir
    ];

    for (const directoryPath of requiredDirectories) {
      if (!(await isDirectory(context.rootDir, directoryPath))) {
        findings.push({
          severity: "error",
          check: "configured-directories",
          message: "Configured directory is missing.",
          path: directoryPath
        });
      }
    }
  }

  return findings;
}

async function isFile(rootDir: string, relativePath: string): Promise<boolean> {
  try {
    return (await lstat(path.join(rootDir, relativePath))).isFile();
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function isDirectory(rootDir: string, relativePath: string): Promise<boolean> {
  try {
    return (await lstat(path.join(rootDir, relativePath))).isDirectory();
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function missingFile(pathValue: string, check: string): DoctorFinding {
  return {
    severity: "error",
    check,
    message: "Required file is missing.",
    path: pathValue
  };
}

