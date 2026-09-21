import { findContext, formatFindContextResult } from "./find.js";

export type ContextHookTool = "claude" | "codex";

export type HookContextOptions = {
  rootDir: string;
  /** Prompt-hook owner: selects the documented output envelope. */
  tool: string;
  /** Raw hook input read from stdin. */
  rawInput: string;
};

export type HookContextResult = {
  tool: ContextHookTool;
  /** The prompt extracted from the hook input, or "" when there is none. */
  prompt: string;
  /** The tool's expected output, or "" when nothing should be injected. */
  output: string;
  matched: boolean;
};

export type ContextHookErrorCode = "UNKNOWN_HOOK_TOOL";

export class ContextHookError extends Error {
  readonly code: ContextHookErrorCode;
  readonly details: string[];

  constructor(code: ContextHookErrorCode, message: string, details: string[] = []) {
    super(message);
    this.name = "ContextHookError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Cards consulted per hook run. One card with its pointers is a few hundred
 * bytes; two is the most that fits under HOOK_MAX_BYTES without truncation
 * doing the choosing.
 */
const HOOK_LIMIT = 2;

/**
 * Pointer budget per hook run. The hook is a nudge, not the lookup: the skill
 * runs the full `persist context` when the agent starts. Oversized output
 * would either spill to disk (Codex) or eat the session budget silently.
 */
const HOOK_MAX_BYTES = 1500;

/**
 * Answer a prompt hook: extract the submitted prompt from the tool's hook
 * input, look up context cards, and return the tool's expected output.
 *
 * Never throws for lookup failures — an unparseable payload, a repository
 * without Persist memory, or nothing clearing the threshold all mean "inject
 * nothing", because a failing lookup must never break the user's prompt.
 * Only an unknown tool is a wiring bug, and that throws.
 */
export async function hookContext(options: HookContextOptions): Promise<HookContextResult> {
  const tool = parseHookTool(options.tool);
  const prompt = extractPrompt(options.rawInput);
  if (prompt === "") {
    return { tool, prompt, output: "", matched: false };
  }

  let pointers = "";
  try {
    const found = await findContext({ rootDir: options.rootDir, task: prompt, limit: HOOK_LIMIT });
    if (found.cards.length > 0) {
      pointers = capBytes(
        formatFindContextResult({
          task: found.task,
          cards: found.cards,
          secondary: [],
          matched: true,
        }),
        HOOK_MAX_BYTES,
      );
    }
  } catch {
    pointers = "";
  }

  if (pointers === "") {
    return { tool, prompt, output: "", matched: false };
  }
  return { tool, prompt, output: formatHookOutput(pointers), matched: true };
}

export function formatHookContextResult(result: HookContextResult): string {
  return result.output;
}

/**
 * Both tools document the same envelope for prompt hooks: JSON on stdout with
 * `hookSpecificOutput.additionalContext` carrying the injected text. Claude
 * Code reads it alongside the submitted prompt; Codex adds it as extra
 * developer context.
 */
function formatHookOutput(pointers: string): string {
  return `${JSON.stringify({
    hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: pointers },
  })}\n`;
}

function parseHookTool(raw: string): ContextHookTool {
  const tool = raw.trim().toLowerCase();
  if (tool === "claude" || tool === "codex") {
    return tool;
  }
  throw new ContextHookError("UNKNOWN_HOOK_TOOL", `Unknown prompt-hook tool "${raw}".`, [
    `Supported tools: claude, codex. Cursor has no documented context-return channel (see the context-cards ADR), so it is covered by the skill and the rule line instead.`,
  ]);
}

/** Both tools hand the hook its input as JSON on stdin with a `prompt` field. */
function extractPrompt(rawInput: string): string {
  try {
    const parsed: unknown = JSON.parse(rawInput);
    const prompt =
      typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)["prompt"]
        : undefined;
    return typeof prompt === "string" ? prompt.trim().replace(/\s+/gu, " ") : "";
  } catch {
    return "";
  }
}

/** Cut to a byte budget on a line boundary, so a truncated pointer list stays readable. */
function capBytes(text: string, maxBytes: number): string {
  if (Buffer.byteLength(text, "utf8") <= maxBytes) {
    return text;
  }
  let cut = text;
  while (cut.length > 0 && Buffer.byteLength(cut, "utf8") > maxBytes) {
    cut = cut.slice(0, -1);
  }
  const newline = cut.lastIndexOf("\n");
  return `${(newline > 0 ? cut.slice(0, newline) : cut).replace(/\s+$/u, "")}\n`;
}

/** Read the whole hook payload from stdin. The prompt text stays in memory: never logged. */
export async function readHookInput(
  stream: NodeJS.ReadableStream = process.stdin,
): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk, "utf8") : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}
