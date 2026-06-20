import { createDefaultConfig } from "../../core/config/default-config.js";
import { ConfigValidationError } from "../../core/config/config-schema.js";
import { loadConfig, ConfigLoadError } from "../../core/config/load-config.js";
import { generateMcpFiles, mcpDocPath } from "../../core/mcp/generate-mcp.js";
import { createWritePlan, type WritePlan } from "../../core/filesystem/write-plan.js";
import { executeWritePlan, type WriteResult } from "../../core/filesystem/write-file-safe.js";
import { SlugifyError, slugify } from "../../core/naming/slugify.js";
import { appendWriteSummary } from "../write-summary.js";

export type McpAddOptions = {
  rootDir: string;
  server: string;
  dryRun?: boolean;
  force?: boolean;
};

export type McpAddResult = {
  server: string;
  docPath: string;
  dryRun: boolean;
  plan: WritePlan;
  writeResult: WriteResult;
};

export type McpAddErrorCode = "INVALID_SERVER_NAME" | "WRITE_PLAN_ERROR";

export class McpAddError extends Error {
  readonly code: McpAddErrorCode;
  readonly details: string[];

  constructor(code: McpAddErrorCode, message: string, details: string[] = []) {
    super(message);
    this.name = "McpAddError";
    this.code = code;
    this.details = details;
  }
}

export async function mcpAdd(options: McpAddOptions): Promise<McpAddResult> {
  const server = createServerSlug(options.server);
  const config = await loadConfigOrDefault(options.rootDir);
  const files = generateMcpFiles({ adrDir: config.adrDir, server });
  const plan = createWritePlan({
    rootDir: options.rootDir,
    files,
    force: options.force,
  });

  if (plan.hasErrors) {
    throw new McpAddError(
      "WRITE_PLAN_ERROR",
      "Recall OS mcp add write plan contains errors.",
      plan.entries
        .filter((entry) => entry.action === "error")
        .map((entry) => `${entry.path}: ${entry.reason}`),
    );
  }

  const writeResult = await executeWritePlan(plan, { dryRun: options.dryRun });

  return {
    server,
    docPath: mcpDocPath(server),
    dryRun: options.dryRun ?? false,
    plan,
    writeResult,
  };
}

export function formatMcpAddResult(result: McpAddResult): string {
  const lines = [
    result.dryRun ? "Recall OS mcp add dry run complete." : "Recall OS mcp add complete.",
    `MCP memory: ${result.docPath} (proposed — review before adopting)`,
  ];

  appendWriteSummary(lines, {
    dryRun: result.dryRun,
    writeResult: result.writeResult,
  });

  return `${lines.join("\n")}\n`;
}

function createServerSlug(server: string): string {
  try {
    return slugify(server);
  } catch (error) {
    if (error instanceof SlugifyError) {
      throw new McpAddError("INVALID_SERVER_NAME", error.message);
    }

    throw error;
  }
}

async function loadConfigOrDefault(rootDir: string) {
  try {
    return await loadConfig(rootDir);
  } catch (error) {
    if (error instanceof ConfigLoadError || error instanceof ConfigValidationError) {
      return createDefaultConfig();
    }

    throw error;
  }
}
