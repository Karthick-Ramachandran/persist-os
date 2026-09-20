import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { ConfigValidationError } from "../core/config/config-schema.js";
import { loadConfig, ConfigLoadError } from "../core/config/load-config.js";

const execFileAsync = promisify(execFile);

export type TestGateOptions = {
  rootDir: string;
  /** Explicit command override (used by tests). When undefined, config `testCommand` applies. */
  testCommand?: string | null;
};

export type TestGateStatus = "passed" | "failed" | "skipped";

export type TestGateResult = {
  status: TestGateStatus;
  exitCode: number;
  command: string | null;
  stdout: string;
  stderr: string;
  reason?: string;
};

/**
 * The test gate: runs the configured one-shot test command and requires it to pass.
 *
 * The command is split on whitespace and executed directly (no shell), so a hostile config value
 * cannot inject shell metacharacters — validation already rejects control characters. A null or
 * absent command skips loudly with configuration help instead of passing silently: a gate whose
 * default is to do nothing must say so. The exit code mirrors the test command's.
 */
export async function runTestGate(options: TestGateOptions): Promise<TestGateResult> {
  const command = await resolveTestCommand(options);

  if (command.resolved === null) {
    return {
      status: "skipped",
      exitCode: 0,
      command: null,
      stdout: "",
      stderr: "",
      reason: command.reason,
    };
  }

  const argv = command.resolved.split(/\s+/u).filter((part) => part.length > 0);
  const executable = argv[0] ?? "";

  try {
    const { stdout, stderr } = await execFileAsync(executable, argv.slice(1), {
      cwd: options.rootDir,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { status: "passed", exitCode: 0, command: command.resolved, stdout, stderr };
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException & {
      code?: number | string;
      stdout?: string;
      stderr?: string;
    };
    const exitCode = typeof nodeError.code === "number" ? nodeError.code : 1;
    return {
      status: "failed",
      exitCode,
      command: command.resolved,
      stdout: nodeError.stdout ?? "",
      stderr: nodeError.stderr ?? "",
    };
  }
}

export function formatTestGateResult(result: TestGateResult): string {
  if (result.status === "skipped") {
    return `Persist OS test gate skipped: ${result.reason}.\n`;
  }

  if (result.status === "passed") {
    return appendOutput(
      [`Persist OS test gate passed: ${result.command ?? "(unknown command)"}`],
      result,
    );
  }

  return appendOutput(
    [
      `Persist OS test gate failed: ${result.command ?? "(unknown command)"} exited with code ${result.exitCode}.`,
    ],
    result,
  );
}

function appendOutput(lines: string[], result: TestGateResult): string {
  if (result.stdout.length > 0) {
    lines.push("", result.stdout.trimEnd());
  }
  if (result.stderr.length > 0) {
    lines.push("", result.stderr.trimEnd());
  }
  return `${lines.join("\n")}\n`;
}

async function resolveTestCommand(
  options: TestGateOptions,
): Promise<{ resolved: string | null; reason: string }> {
  if (options.testCommand !== undefined) {
    return options.testCommand === null
      ? { resolved: null, reason: unconfiguredReason(null) }
      : { resolved: options.testCommand, reason: "" };
  }

  try {
    const config = await loadConfig(options.rootDir);
    if (config.testCommand === null) {
      return { resolved: null, reason: unconfiguredReason(null) };
    }
    return { resolved: config.testCommand, reason: "" };
  } catch (error) {
    if (error instanceof ConfigLoadError || error instanceof ConfigValidationError) {
      return { resolved: null, reason: unconfiguredReason(error.message) };
    }
    throw error;
  }
}

function unconfiguredReason(configProblem: string | null): string {
  const hint =
    'the gate is off — set testCommand in .persist/config.json to a one-shot test command (e.g. "pnpm run test:run") or re-run `persist init` to detect one';
  return configProblem === null ? hint : `${configProblem} ${hint}`;
}
