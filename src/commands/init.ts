import { existsSync } from "node:fs";
import path from "node:path";

import { aiToolTargetSchema } from "../core/config/config-schema.js";
import { createDefaultConfig } from "../core/config/default-config.js";
import { CONFIG_PATH } from "../core/config/load-config.js";
import {
  createWritePlan,
  type WritePlan,
  type WriteFileInput,
} from "../core/filesystem/write-plan.js";
import { executeWritePlan, type WriteResult } from "../core/filesystem/write-file-safe.js";
import { inspectRepo, summarizeSignals, type RepoSignals } from "../core/adopt/inspect-repo.js";
import { generateInitFiles } from "../core/generator/generate-init.js";
import { detectPreCommitGates } from "../core/hooks/detect-gates.js";
import {
  CLAUDE_SETTINGS_PATH,
  HOOKS_PATH_ACTIVATION_COMMAND,
  PRE_COMMIT_HOOK_PATH,
  SESSION_START_HOOK_PATH,
  renderClaudeSettings,
  renderPreCommitHook,
  renderSessionStartHook,
} from "../core/hooks/generate-hook.js";
import { getPreset } from "../core/presets/preset-registry.js";
import type { Preset } from "../core/presets/preset-schema.js";
import { generateSkillFiles } from "../core/skills/generate-skill.js";
import { listCatalogSkillNames } from "../core/skills/skill-catalog.js";
import { appendNextSteps, appendWriteSummary } from "./write-summary.js";

export type InitOptions = {
  rootDir: string;
  preset?: string;
  aiTools?: string[];
  dryRun?: boolean;
  force?: boolean;
  reinit?: boolean;
};

export type InitResult = {
  preset: string | null;
  dryRun: boolean;
  plan: WritePlan;
  writeResult: WriteResult;
  detected: RepoSignals;
};

export type InitErrorCode =
  | "UNKNOWN_PRESET"
  | "INVALID_AI_TOOL"
  | "WRITE_PLAN_ERROR"
  | "EXISTING_INSTALLATION";

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
  if (
    options.force === true &&
    options.reinit !== true &&
    existsSync(path.join(options.rootDir, CONFIG_PATH))
  ) {
    throw new InitError(
      "EXISTING_INSTALLATION",
      "Refusing to re-initialize an existing Recall OS installation.",
      [
        "An existing .recall/config.json was found in this directory.",
        "Running init --force here would overwrite existing repository memory.",
        "Pass --reinit together with --force to overwrite an existing installation.",
      ],
    );
  }

  validateAiTools(options.aiTools);

  const preset = resolvePreset(options.preset);
  // Read-only inspection of the existing repository so init can surface the detected stack (proposed,
  // never accepted) — run before writes so it reflects the user's repo, not our generated scaffold.
  const detected = await inspectRepo(options.rootDir);
  const preCommitGates = await detectPreCommitGates(options.rootDir);
  const config = createDefaultConfig({
    preset: preset?.id ?? null,
    preCommitGates,
    ...(options.aiTools !== undefined ? { aiTools: options.aiTools } : {}),
  });
  const files = createInitWriteFiles(options.rootDir, config, preset);
  const plan = createWritePlan({
    rootDir: options.rootDir,
    files,
    force: options.force,
  });

  if (plan.hasErrors) {
    throw new InitError(
      "WRITE_PLAN_ERROR",
      "Recall OS init write plan contains errors.",
      plan.entries
        .filter((entry) => entry.action === "error")
        .map((entry) => `${entry.path}: ${entry.reason}`),
    );
  }

  const writeResult = await executeWritePlan(plan, { dryRun: options.dryRun });

  return {
    preset: preset?.id ?? null,
    dryRun: options.dryRun ?? false,
    plan,
    writeResult,
    detected,
  };
}

export function formatInitResult(result: InitResult): string {
  const lines = [
    result.dryRun ? "Recall OS init dry run complete." : "Recall OS init complete.",
    `Preset: ${result.preset ?? "none"}`,
  ];

  if (!result.dryRun) {
    lines.push(
      `Generated repository memory, ${listCatalogSkillNames().length} agent skills, a pre-commit hook, a CI workflow, a Claude SessionStart hook, and a Cursor rule that load memory automatically.`,
    );
  }

  appendWriteSummary(lines, {
    dryRun: result.dryRun,
    writeResult: result.writeResult,
  });

  appendDetectedStack(lines, result.detected);

  const hookWritten =
    result.writeResult.created.includes(PRE_COMMIT_HOOK_PATH) ||
    result.writeResult.overwritten.includes(PRE_COMMIT_HOOK_PATH);

  if (hookWritten) {
    lines.push("");
    lines.push(
      result.dryRun
        ? "Pre-commit hook will be written to .recall/hooks/pre-commit."
        : "Pre-commit hook written to .recall/hooks/pre-commit.",
    );
    lines.push(`Enable it once per clone: ${HOOKS_PATH_ACTIVATION_COMMAND}`);
  }

  if (!result.dryRun) {
    appendNextSteps(lines, [
      "Read CLAUDE.md and AGENTS.md, then the docs/ memory they point to.",
      "AI agent skills are in .claude/skills/ and .agents/skills/ — restart your AI tool to load them.",
      "Memory loads automatically per tool: a Claude SessionStart hook (.claude/hooks/session-start.sh), a Cursor rule (.cursor/rules/recall-memory.mdc), and AGENTS.md for Codex.",
      "CI is wired in .github/workflows/recall.yml; the pre-commit hook is in .recall/hooks/.",
      "Plan your first feature: `recall feature create <name>`.",
      "Record a decision: `recall adr create <title>`, then accept it with `recall adr accept`.",
      "Check repository memory health anytime: `recall doctor`.",
    ]);
  }

  return `${lines.join("\n")}\n`;
}

function appendDetectedStack(lines: string[], detected: RepoSignals): void {
  const hasSignal =
    detected.languages.length > 0 ||
    detected.frameworks.length > 0 ||
    detected.packageManager !== null ||
    detected.testsEvidence !== null;

  if (!hasSignal) {
    return;
  }

  // Stack-relevant lines only; README/docs presence is noise right after init writes docs/.
  const stack = summarizeSignals(detected).filter(
    (line) => !line.startsWith("- README") && !line.startsWith("- Docs"),
  );

  lines.push("");
  lines.push("Detected in this repository (proposed — review, nothing was accepted):");
  lines.push(...stack);
  lines.push(
    "If any signal is wrong, correct the source file noted. Run `recall adopt` to record this as proposed memory.",
  );
}

type AiToolTarget = (typeof aiToolTargetSchema.options)[number];

function validateAiTools(
  aiTools: string[] | undefined,
): asserts aiTools is AiToolTarget[] | undefined {
  if (aiTools === undefined) {
    return;
  }

  const allowed = aiToolTargetSchema.options;
  const invalid = aiTools.filter((tool) => !allowed.includes(tool as AiToolTarget));

  if (aiTools.length === 0 || invalid.length > 0) {
    throw new InitError(
      "INVALID_AI_TOOL",
      aiTools.length === 0
        ? "No AI tools given to --ai-tools."
        : `Unknown --ai-tools value(s): ${invalid.join(", ")}.`,
      [`Allowed values: ${allowed.join(", ")}.`],
    );
  }
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
  preset: Preset | null,
): WriteFileInput[] {
  const files: WriteFileInput[] = [
    {
      path: CONFIG_PATH,
      content: `${JSON.stringify(config, null, 2)}\n`,
    },
    ...generateInitFiles({ rootDir, preset }),
    {
      path: PRE_COMMIT_HOOK_PATH,
      content: renderPreCommitHook(config.preCommitGates),
      executable: true,
    },
    // A Claude Code SessionStart hook that injects a memory map every session, so a fresh agent
    // reliably loads durable memory, plus the settings that wire it (skipped if settings exist).
    {
      path: SESSION_START_HOOK_PATH,
      content: renderSessionStartHook(),
      executable: true,
    },
    {
      path: CLAUDE_SETTINGS_PATH,
      content: renderClaudeSettings(),
    },
    // Generate the agent skill set so a fresh repo has the workflows that guide AI agents,
    // not just the docs. Written to both the Claude and portable Agent Skills targets.
    ...listCatalogSkillNames().flatMap((name) => generateSkillFiles(name).files),
  ];

  return files.filter((file) => keepForTools(file.path, config.aiTools));
}

/**
 * Keep only the tool-specific files the repository's selected `aiTools` actually use. Tool-agnostic
 * files (config, docs, `.recall/`, `.github/`, the pre-commit hook) and `AGENTS.md` are always kept —
 * `AGENTS.md` is the portable floor that Claude imports and that Codex and Cursor auto-load.
 */
function keepForTools(filePath: string, aiTools: readonly string[]): boolean {
  if (filePath === "CLAUDE.md" || filePath.startsWith(".claude/")) {
    return aiTools.includes("claude");
  }
  if (filePath.startsWith(".cursor/")) {
    return aiTools.includes("cursor");
  }
  if (filePath.startsWith(".agents/")) {
    return aiTools.includes("codex") || aiTools.includes("generic");
  }
  return true;
}
