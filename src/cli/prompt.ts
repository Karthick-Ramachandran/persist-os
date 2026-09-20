import { createInterface, type Interface } from "node:readline/promises";

import { aiToolTargetSchema, type AiToolTarget } from "../core/config/config-schema.js";
import { getStyle, type StyleHelpers } from "./style.js";

export type PromptStreams = {
  input: NodeJS.ReadableStream;
  output: NodeJS.WritableStream;
};

const AI_TOOL_CHOICES = aiToolTargetSchema.options;

/**
 * One readline interface shared across all questions of a run. Sharing matters:
 * a fresh interface per question can swallow buffered lines when the previous
 * one closes, hanging the next question on a fully-fed stream.
 */
export type Prompter = {
  askYesNo(question: string, defaultValue: boolean, progress?: string): Promise<boolean>;
  askAiTools(defaultValue: AiToolTarget[], progress?: string): Promise<AiToolTarget[]>;
  askTestGate(detectedCommand: string | null, progress?: string): Promise<boolean>;
  close(): void;
};

function outputTTY(streams: PromptStreams): boolean | undefined {
  const isTTY = (streams.output as unknown as { isTTY?: unknown }).isTTY;
  return typeof isTTY === "boolean" ? isTTY : undefined;
}

export function createPrompter(streams: PromptStreams, style?: StyleHelpers): Prompter {
  const resolved = style ?? getStyle(outputTTY(streams));
  const rl: Interface = createInterface({ input: streams.input, output: streams.output });

  /**
   * One line of input. A closed stream (Ctrl+D on a TTY) reads as empty, so it
   * takes the default instead of crashing.
   */
  async function askLine(prompt: string): Promise<string> {
    try {
      return await rl.question(prompt);
    } catch (error) {
      if ((error as NodeJS.ErrnoException | null)?.code === "ERR_USE_AFTER_CLOSE") {
        return "";
      }
      throw error;
    }
  }

  function tagged(progress: string | undefined): string {
    return progress === undefined || progress === "" ? "" : `${resolved.muted(progress)} `;
  }

  /**
   * Yes/no prompt. Empty input takes the default; anything unparseable re-asks
   * rather than crashing or silently taking the default.
   */
  async function askYesNo(
    question: string,
    defaultValue: boolean,
    progress?: string,
  ): Promise<boolean> {
    const hint = defaultValue ? `[${resolved.accent("Y")}/n]` : `[y/${resolved.accent("N")}]`;

    for (;;) {
      const answer = (await askLine(`${tagged(progress)}${resolved.secondary(question)} ${hint} `))
        .trim()
        .toLowerCase();

      if (answer === "") {
        return defaultValue;
      }
      if (answer === "y" || answer === "yes") {
        return true;
      }
      if (answer === "n" || answer === "no") {
        return false;
      }

      streams.output.write(`${resolved.warn("Please answer y or n.")}\n`);
    }
  }

  /**
   * AI tool selection. Accepts comma- or space-separated names; empty input takes
   * the default; unknown names re-ask with the allowed values named.
   */
  async function askAiTools(
    defaultValue: AiToolTarget[],
    progress?: string,
  ): Promise<AiToolTarget[]> {
    for (;;) {
      const answer = (
        await askLine(
          `${tagged(progress)}${resolved.secondary(`Which AI tools? (${AI_TOOL_CHOICES.join(", ")})`)} [default: ${resolved.muted(defaultValue.join(", "))}] `,
        )
      ).trim();

      if (answer === "") {
        return [...defaultValue];
      }

      const picked = answer
        .split(/[\s,]+/u)
        .filter((part) => part.length > 0)
        .map((part) => part.toLowerCase());
      const invalid = picked.filter(
        (part) => !(AI_TOOL_CHOICES as readonly string[]).includes(part),
      );

      if (invalid.length > 0) {
        streams.output.write(
          `${resolved.warn(`Unknown AI tools: ${invalid.join(", ")}. Allowed: ${AI_TOOL_CHOICES.join(", ")}.\n`)}`,
        );
        continue;
      }

      return [...new Set(picked)] as AiToolTarget[];
    }
  }

  /**
   * Test-gate question. Prints the detected command on its own line before asking
   * (never after); when nothing was detected it says so and defaults to no
   * rather than enabling a gate with no command.
   */
  async function askTestGate(detectedCommand: string | null, progress?: string): Promise<boolean> {
    if (detectedCommand === null) {
      streams.output.write(
        `${resolved.secondary("No one-shot test script detected — the test gate will stay off unless you configure testCommand later.")}\n`,
      );
      return askYesNo("Enable the test gate?", false, progress);
    }

    streams.output.write(`  ${resolved.accent(detectedCommand)}\n`);
    return askYesNo("Enable the test gate?", true, progress);
  }

  return {
    askYesNo,
    askAiTools,
    askTestGate,
    close: () => rl.close(),
  };
}
