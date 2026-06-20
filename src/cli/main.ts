import { Command, CommanderError } from "commander";

import { formatInitResult, initProject, InitError } from "../commands/init.js";

export type CliWritable = {
  write(message: string): void;
};

export type CliIo = {
  cwd?: string;
  stdout?: CliWritable;
  stderr?: CliWritable;
};

export function createCliProgram(io: CliIo = {}): Command {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const cwd = io.cwd ?? process.cwd();
  const program = new Command();

  program
    .name("specforge")
    .description("Initialize and maintain repository memory for AI-assisted software work.")
    .exitOverride()
    .configureOutput({
      writeOut: (message) => stdout.write(message),
      writeErr: (message) => stderr.write(message)
    });

  program
    .command("init")
    .description("Initialize SpecForge repository memory.")
    .option("--preset <id>", "Apply optional preset guidance and proposed decisions.")
    .option("--dry-run", "Show planned writes without writing files.")
    .option("--force", "Overwrite existing files explicitly.")
    .action(async (options: { preset?: string; dryRun?: boolean; force?: boolean }) => {
      const result = await initProject({
        rootDir: cwd,
        preset: options.preset,
        dryRun: options.dryRun,
        force: options.force
      });

      stdout.write(formatInitResult(result));
    });

  return program;
}

export async function main(argv: string[] = process.argv.slice(2), io: CliIo = {}): Promise<number> {
  const stderr = io.stderr ?? process.stderr;
  const program = createCliProgram(io);

  try {
    await program.parseAsync(argv, { from: "user" });
    return 0;
  } catch (error) {
    if (error instanceof InitError) {
      stderr.write(`${error.message}\n`);
      for (const detail of error.details) {
        stderr.write(`- ${detail}\n`);
      }
      return 1;
    }

    if (error instanceof CommanderError) {
      return error.exitCode;
    }

    stderr.write(error instanceof Error ? `${error.message}\n` : "Unknown error.\n");
    return 1;
  }
}
