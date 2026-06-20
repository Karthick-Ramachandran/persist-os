import { createDefaultConfig } from "../core/config/default-config.js";
import { CONFIG_PATH } from "../core/config/load-config.js";
import { createWritePlan, type WritePlan, type WriteFileInput } from "../core/filesystem/write-plan.js";
import { executeWritePlan, type WriteResult } from "../core/filesystem/write-file-safe.js";
import { generateInitFiles } from "../core/generator/generate-init.js";
import { getPreset } from "../core/presets/preset-registry.js";
import type { Preset } from "../core/presets/preset-schema.js";

export type InitOptions = {
  rootDir: string;
  preset?: string;
  dryRun?: boolean;
  force?: boolean;
};

export type InitResult = {
  preset: string | null;
  dryRun: boolean;
  plan: WritePlan;
  writeResult: WriteResult;
};

export type InitErrorCode = "UNKNOWN_PRESET" | "WRITE_PLAN_ERROR";

export class InitError extends Error {
  readonly code: InitErrorCode;
  readonly details: string[];

  constructor(code: InitErrorCode, message: string, details: string[] = []) {
    super(message);
    this.name = "InitError";
    this.code = code;
    this.details = details;
  }
}

export async function initProject(options: InitOptions): Promise<InitResult> {
  const preset = resolvePreset(options.preset);
  const config = createDefaultConfig({ preset: preset?.id ?? null });
  const files = createInitWriteFiles(options.rootDir, config, preset);
  const plan = createWritePlan({
    rootDir: options.rootDir,
    files,
    force: options.force
  });

  if (plan.hasErrors) {
    throw new InitError(
      "WRITE_PLAN_ERROR",
      "SpecForge init write plan contains errors.",
      plan.entries
        .filter((entry) => entry.action === "error")
        .map((entry) => `${entry.path}: ${entry.reason}`)
    );
  }

  const writeResult = await executeWritePlan(plan, { dryRun: options.dryRun });

  return {
    preset: preset?.id ?? null,
    dryRun: options.dryRun ?? false,
    plan,
    writeResult
  };
}

export function formatInitResult(result: InitResult): string {
  const lines = [
    result.dryRun ? "SpecForge init dry run complete." : "SpecForge init complete.",
    `Preset: ${result.preset ?? "none"}`
  ];

  appendFileList(lines, result.dryRun ? "Planned creates" : "Created", result.writeResult.created);
  appendFileList(
    lines,
    result.dryRun ? "Planned overwrites" : "Overwritten",
    result.writeResult.overwritten
  );
  appendFileList(lines, "Skipped", result.writeResult.skipped);

  return `${lines.join("\n")}\n`;
}

function resolvePreset(presetId: string | undefined): Preset | null {
  if (presetId === undefined) {
    return null;
  }

  const preset = getPreset(presetId);

  if (preset === undefined) {
    throw new InitError("UNKNOWN_PRESET", `Unknown preset "${presetId}".`);
  }

  return preset;
}

function createInitWriteFiles(
  rootDir: string,
  config: ReturnType<typeof createDefaultConfig>,
  preset: Preset | null
): WriteFileInput[] {
  return [
    {
      path: CONFIG_PATH,
      content: `${JSON.stringify(config, null, 2)}\n`
    },
    ...generateInitFiles({ rootDir, preset })
  ];
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
