import { existsSync } from "node:fs";
import path from "node:path";

import { aiToolTargetSchema, type AiToolTarget } from "../core/config/config-schema.js";
import { createDefaultConfig } from "../core/config/default-config.js";
import { CONFIG_PATH } from "../core/config/load-config.js";
import {
  createWritePlan,
  type WritePlan,
  type WriteFileInput,
} from "../core/filesystem/write-plan.js";
import { executeWritePlan, type WriteResult } from "../core/filesystem/write-file-safe.js";
import { inspectRepo, summarizeSignals, type RepoSignals } from "../core/adopt/inspect-repo.js";
import { generateInitFiles, generateOptInFiles } from "../core/generator/generate-init.js";
import { detectPrePushGates, detectTestCommand } from "../core/hooks/detect-gates.js";
import {
  CLAUDE_SETTINGS_PATH,
  HOOKS_PATH_ACTIVATION_COMMAND,
  PRE_COMMIT_HOOK_PATH,
  PRE_PUSH_HOOK_PATH,
  SESSION_START_HOOK_PATH,
  renderClaudeSettings,
  renderPreCommitHook,
  renderPrePushHook,
  renderSessionStartHook,
} from "../core/hooks/generate-hook.js";
import { generateSkillFiles } from "../core/skills/generate-skill.js";
import { keepPathForTools } from "../core/aitools/tool-paths.js";
import { listCatalogSkillNames } from "../core/skills/skill-catalog.js";
import { createPrompter, type PromptStreams } from "../cli/prompt.js";
import { getStyle } from "../cli/style.js";
import { appendNextSteps, appendWriteSummary } from "./write-summary.js";

export type InitOptions = {
  rootDir: string;
  aiTools?: string[];
  features?: boolean;
  modules?: boolean;
  dryRun?: boolean;
  force?: boolean;
  reinit?: boolean;
  yes?: boolean;
  /** Defaults to `process.stdin.isTTY`; injectable so tests never need a real TTY. */
  stdinTTY?: boolean;
  /** Streams the interactive questions use; default to process stdin/stdout. */
  promptStreams?: PromptStreams;
};

export type InitResult = {
  dryRun: boolean;
  plan: WritePlan;
  writeResult: WriteResult;
  detected: RepoSignals;
  // The resolved tool selection, so the closing output can describe only the tools the user picked.
  aiTools: AiToolTarget[];
  // The detected one-shot test command saved as testCommand (null when none was safe to pick).
  testCommand: string | null;
  // True when stdin was not a TTY and init proceeded with defaults without prompting.
  assumedNonTTYDefaults: boolean;
};

export type InitErrorCode = "INVALID_AI_TOOL" | "WRITE_PLAN_ERROR" | "EXISTING_INSTALLATION";

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
      "Refusing to re-initialize an existing Persist OS installation.",
      [
        "An existing .persist/config.json was found in this directory.",
        "Running init --force here would overwrite existing repository memory.",
        "Pass --reinit together with --force to overwrite an existing installation.",
      ],
    );
  }

  validateAiTools(options.aiTools);

  // Read-only inspection of the existing repository so init can surface the detected stack (proposed,
  // never accepted) — run before writes so it reflects the user's repo, not our generated scaffold.
  const detected = await inspectRepo(options.rootDir);
  // Doctor already runs in the pre-commit hook body, so no commit-time gates are seeded.
  // The expensive gates (tests, typecheck, lint) are detected for the pre-push hook instead.
  const detectedTestCommand = await detectTestCommand(options.rootDir);
  const prePushGates = await detectPrePushGates(options.rootDir);

  const { aiTools, features, modules, testCommand, assumedNonTTYDefaults } =
    await resolveInitAnswers(options, detectedTestCommand);

  validateAiTools(aiTools);

  const config = createDefaultConfig({
    preCommitGates: [],
    prePushGates,
    testCommand,
    ...(aiTools !== undefined ? { aiTools } : {}),
  });
  const files = createInitWriteFiles(options.rootDir, config, {
    features,
    modules,
  });
  const plan = createWritePlan({
    rootDir: options.rootDir,
    files,
    force: options.force,
  });

  if (plan.hasErrors) {
    throw new InitError(
      "WRITE_PLAN_ERROR",
      "Persist OS init write plan contains errors.",
      plan.entries
        .filter((entry) => entry.action === "error")
        .map((entry) => `${entry.path}: ${entry.reason}`),
    );
  }

  const writeResult = await executeWritePlan(plan, { dryRun: options.dryRun });

  return {
    dryRun: options.dryRun ?? false,
    plan,
    writeResult,
    detected,
    aiTools: [...config.aiTools],
    testCommand: config.testCommand,
    assumedNonTTYDefaults,
  };
}

/**
 * Answer resolution: explicit flags (or `--yes`) are a complete instruction and
 * never prompt; otherwise a TTY is asked the four questions and a non-TTY
 * proceeds with defaults so CI can never hang on a prompt.
 */
async function resolveInitAnswers(
  options: InitOptions,
  detectedTestCommand: string | null,
): Promise<{
  aiTools: string[] | undefined;
  features: boolean;
  modules: boolean;
  testCommand: string | null;
  assumedNonTTYDefaults: boolean;
}> {
  const explicitInstruction =
    options.aiTools !== undefined ||
    options.features !== undefined ||
    options.modules !== undefined ||
    options.force === true ||
    options.reinit === true;

  if (options.yes === true || explicitInstruction) {
    return {
      aiTools: options.aiTools,
      features: options.features ?? false,
      modules: options.modules ?? false,
      testCommand: detectedTestCommand,
      assumedNonTTYDefaults: false,
    };
  }

  const stdinTTY = options.stdinTTY ?? process.stdin.isTTY ?? false;

  if (!stdinTTY) {
    return {
      aiTools: options.aiTools,
      features: options.features ?? false,
      modules: options.modules ?? false,
      testCommand: detectedTestCommand,
      assumedNonTTYDefaults: true,
    };
  }

  const streams = options.promptStreams ?? { input: process.stdin, output: process.stdout };
  const prompter = createPrompter(streams);

  try {
    const aiTools = await prompter.askAiTools([...createDefaultConfig().aiTools], "[1/4]");
    const features = await prompter.askYesNo("Track features?", false, "[2/4]");
    const modules = await prompter.askYesNo("Track modules?", false, "[3/4]");
    const enableTestGate = await prompter.askTestGate(detectedTestCommand, "[4/4]");

    return {
      aiTools,
      features,
      modules,
      testCommand: enableTestGate ? detectedTestCommand : null,
      assumedNonTTYDefaults: false,
    };
  } finally {
    prompter.close();
  }
}

/**
 * The init masthead: a small wordmark and one line of what is about to happen.
 * Restrained by design — the top of the landing page, not an installer banner.
 */
export function buildMasthead(): string {
  const style = getStyle();
  return `${style.heading("persist")} ${style.muted("repository memory for AI-assisted software work")}\n${style.rule()}`;
}

export function formatInitResult(result: InitResult): string {
  const style = getStyle();
  const lines = [
    buildMasthead(),
    style.heading(
      result.dryRun ? "Persist OS init dry run complete." : "Persist OS init complete.",
    ),
    result.testCommand === null
      ? "Test gate: not configured — no one-shot test script detected (set testCommand in .persist/config.json to enable `persist test-gate`)."
      : `Test gate: ${result.testCommand} (saved as testCommand in .persist/config.json).`,
  ];

  if (result.assumedNonTTYDefaults) {
    lines.push("stdin is not a TTY — proceeded with defaults without prompting (as --yes).");
  }

  if (!result.dryRun) {
    lines.push(buildInitSummary(result));
  }

  appendWriteSummary(lines, {
    dryRun: result.dryRun,
    writeResult: result.writeResult,
  });

  // ADR-0012: init states which executable files it wrote, so generated executables
  // (hooks, skill scripts) are visible rather than discovered later.
  if (!result.dryRun) {
    const executables = executedExecutables(result);
    if (executables.length > 0) {
      lines.push("");
      lines.push(`Executable files written: ${joinList(executables)}.`);
    }
  }

  appendDetectedStack(lines, result.detected);

  const hookWritten =
    result.writeResult.created.includes(PRE_COMMIT_HOOK_PATH) ||
    result.writeResult.overwritten.includes(PRE_COMMIT_HOOK_PATH);

  if (hookWritten) {
    lines.push("");
    lines.push(
      result.dryRun
        ? "Pre-commit and pre-push hooks will be written to .persist/hooks/."
        : "Pre-commit and pre-push hooks written to .persist/hooks/ (pre-push is the final regression gate before you push).",
    );
    lines.push(`Enable them once per clone: ${HOOKS_PATH_ACTIVATION_COMMAND}`);
  }

  if (!result.dryRun) {
    appendNextSteps(lines, buildInitNextSteps(result));
  }

  return `${lines.join("\n")}\n`;
}

function presentPaths(result: InitResult): Set<string> {
  return new Set([
    ...result.writeResult.created,
    ...result.writeResult.overwritten,
    ...result.writeResult.skipped,
  ]);
}

function generatedPaths(result: InitResult): Set<string> {
  return new Set([...result.writeResult.created, ...result.writeResult.overwritten]);
}

function hasPrefix(paths: Set<string>, prefix: string): boolean {
  for (const filePath of paths) {
    if (filePath === prefix || filePath.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}

function buildInitSummary(result: InitResult): string {
  const generated = generatedPaths(result);

  if (generated.size === 0) {
    return "Repository memory already exists — no files were generated.";
  }

  const parts: string[] = ["repository memory"];

  if (hasPrefix(generated, ".claude/skills/") || hasPrefix(generated, ".agents/skills/")) {
    const targets: string[] = [];
    if (hasPrefix(generated, ".claude/skills/")) {
      targets.push(".claude/skills/");
    }
    if (hasPrefix(generated, ".agents/skills/")) {
      targets.push(".agents/skills/");
    }
    parts.push(`${listCatalogSkillNames().length} agent skills (${targets.join(" and ")})`);
  }

  const hasPreCommit = generated.has(PRE_COMMIT_HOOK_PATH);
  const hasPrePush = generated.has(PRE_PUSH_HOOK_PATH);
  if (hasPreCommit && hasPrePush) {
    parts.push("pre-commit and pre-push hooks");
  } else if (hasPreCommit) {
    parts.push("a pre-commit hook");
  } else if (hasPrePush) {
    parts.push("a pre-push hook");
  }

  if (generated.has(".github/workflows/persist.yml")) {
    parts.push("a CI workflow");
  }

  if (generated.has(SESSION_START_HOOK_PATH)) {
    parts.push("a Claude SessionStart hook");
  }

  if (generated.has(".cursor/rules/persist-memory.mdc")) {
    parts.push("a Cursor rule");
  }

  if (parts.length === 1) {
    return "Generated repository memory.";
  }

  return `Generated ${joinList(parts)} that load memory automatically.`;
}

function buildInitNextSteps(result: InitResult): string[] {
  const present = presentPaths(result);
  const steps: string[] = [];

  const hasAgents = present.has("AGENTS.md");
  const hasClaude = present.has("CLAUDE.md");
  if (hasAgents && hasClaude) {
    steps.push("Read CLAUDE.md and AGENTS.md, then the docs/ memory they point to.");
  } else if (hasAgents) {
    steps.push("Read AGENTS.md, then the docs/ memory it points to.");
  } else if (hasClaude) {
    steps.push("Read CLAUDE.md, then the docs/ memory it points to.");
  }

  const hasClaudeSkills = hasPrefix(present, ".claude/skills/");
  const hasAgentSkills = hasPrefix(present, ".agents/skills/");
  if (hasClaudeSkills && hasAgentSkills) {
    steps.push(
      "AI agent skills are in .claude/skills/ and .agents/skills/ — restart your AI tool to load them.",
    );
  } else if (hasClaudeSkills) {
    steps.push("AI agent skills are in .claude/skills/ — restart your AI tool to load them.");
  } else if (hasAgentSkills) {
    steps.push("AI agent skills are in .agents/skills/ — restart your AI tool to load them.");
  }

  const autoLoad: string[] = [];
  if (present.has(SESSION_START_HOOK_PATH)) {
    autoLoad.push("a Claude SessionStart hook (.claude/hooks/session-start.sh)");
  }
  if (present.has(".cursor/rules/persist-memory.mdc")) {
    autoLoad.push("a Cursor rule (.cursor/rules/persist-memory.mdc)");
  }
  if (hasAgents) {
    // AGENTS.md is always generated, so name Codex only when the user actually selected it.
    autoLoad.push(
      result.aiTools.includes("codex")
        ? "AGENTS.md for Codex"
        : "AGENTS.md as the portable fallback",
    );
  }
  if (autoLoad.length > 0) {
    steps.push(`Memory loads automatically per tool: ${joinList(autoLoad)}.`);
  }

  const hasCi = present.has(".github/workflows/persist.yml");
  const hasHook = present.has(PRE_COMMIT_HOOK_PATH) || present.has(PRE_PUSH_HOOK_PATH);
  if (hasCi && hasHook) {
    steps.push(
      "CI is wired in .github/workflows/persist.yml; the pre-commit hook is in .persist/hooks/.",
    );
  } else if (hasCi) {
    steps.push("CI is wired in .github/workflows/persist.yml.");
  } else if (hasHook) {
    steps.push("The pre-commit hook is in .persist/hooks/.");
  }

  steps.push("Plan your first feature: `persist feature create <name>`.");
  steps.push(
    "Record a decision: `persist adr create <title>`, then accept it with `persist adr accept`.",
  );
  steps.push("Check repository memory health anytime: `persist doctor`.");

  return steps;
}

function executedExecutables(result: InitResult): string[] {
  const written = new Set([...result.writeResult.created, ...result.writeResult.overwritten]);
  const paths: string[] = [];

  for (const entry of result.plan.entries) {
    if (
      (entry.action === "create" || entry.action === "overwrite") &&
      "executable" in entry &&
      entry.executable === true &&
      written.has(entry.path)
    ) {
      paths.push(entry.path);
    }
  }

  return paths;
}

function joinList(parts: string[]): string {
  if (parts.length === 1) {
    return parts[0] ?? "";
  }

  if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`;
  }

  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
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
    "If any signal is wrong, correct the source file noted. Run `persist adopt` to record this as proposed memory.",
  );
}

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

function createInitWriteFiles(
  rootDir: string,
  config: ReturnType<typeof createDefaultConfig>,
  optIn: { features: boolean; modules: boolean },
): WriteFileInput[] {
  const files: WriteFileInput[] = [
    {
      path: CONFIG_PATH,
      content: `${JSON.stringify(config, null, 2)}\n`,
    },
    ...generateInitFiles({ rootDir }),
    ...generateOptInFiles({
      featuresDir: config.featuresDir,
      modulesDir: config.modulesDir,
      features: optIn.features,
      modules: optIn.modules,
    }),
    {
      path: PRE_COMMIT_HOOK_PATH,
      content: renderPreCommitHook(config.preCommitGates),
      executable: true,
    },
    // The pre-push hook runs the expensive gates once per push: the test gate first, then the
    // push-only gates. Doctor stays on pre-commit.
    {
      path: PRE_PUSH_HOOK_PATH,
      content: renderPrePushHook(config.testCommand, config.prePushGates),
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

  return files.filter((file) => keepPathForTools(file.path, config.aiTools));
}
