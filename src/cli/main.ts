import { Command, CommanderError } from "commander";

import { createAdr, AdrCreateError, formatAdrCreateResult } from "../commands/adr/create.js";
import {
  createFeature,
  FeatureCreateError,
  formatFeatureCreateResult,
} from "../commands/feature/create.js";
import { adoptProject, AdoptError, formatAdoptResult } from "../commands/adopt.js";
import { doctorProject, formatDoctorResult } from "../commands/doctor.js";
import { formatInitResult, initProject, InitError } from "../commands/init.js";
import {
  createModule,
  formatModuleCreateResult,
  ModuleCreateError,
} from "../commands/module/create.js";
import { formatPresetListResult, listPresetEntries } from "../commands/preset/list.js";
import {
  createSkill,
  formatSkillCreateResult,
  SkillCreateError,
} from "../commands/skill/create.js";
import { formatSkillListResult } from "../commands/skill/list.js";

export type CliWritable = {
  write(message: string): void;
};

export type CliIo = {
  cwd?: string;
  stdout?: CliWritable;
  stderr?: CliWritable;
};

export function createCliProgram(
  io: CliIo = {},
  state: { exitCode: number } = { exitCode: 0 },
): Command {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const cwd = io.cwd ?? process.cwd();
  const program = new Command();

  program
    .name("recall")
    .description("Initialize and maintain repository memory for AI-assisted software work.")
    .exitOverride()
    .configureOutput({
      writeOut: (message) => stdout.write(message),
      writeErr: (message) => stderr.write(message),
    });

  program
    .command("init")
    .description("Initialize Recall OS repository memory.")
    .option("--preset <id>", "Apply optional preset guidance and proposed decisions.")
    .option("--dry-run", "Show planned writes without writing files.")
    .option("--force", "Overwrite existing files explicitly.")
    .option("--reinit", "Allow --force to overwrite an existing Recall OS installation.")
    .action(
      async (options: { preset?: string; dryRun?: boolean; force?: boolean; reinit?: boolean }) => {
        const result = await initProject({
          rootDir: cwd,
          preset: options.preset,
          dryRun: options.dryRun,
          force: options.force,
          reinit: options.reinit,
        });

        stdout.write(formatInitResult(result));
      },
    );

  program
    .command("adopt")
    .description("Inspect an existing repository and propose reviewable memory.")
    .option("--dry-run", "Show planned writes without writing files.")
    .option("--force", "Overwrite existing files explicitly.")
    .action(async (options: { dryRun?: boolean; force?: boolean }) => {
      const result = await adoptProject({
        rootDir: cwd,
        dryRun: options.dryRun,
        force: options.force,
      });

      stdout.write(formatAdoptResult(result));
    });

  const featureCommand = program.command("feature").description("Manage Recall OS feature memory.");

  featureCommand
    .command("create")
    .description("Create feature memory docs.")
    .argument("<name>", "Feature name.")
    .option("--dry-run", "Show planned writes without writing files.")
    .option("--force", "Overwrite existing files explicitly.")
    .action(async (name: string, options: { dryRun?: boolean; force?: boolean }) => {
      const result = await createFeature({
        rootDir: cwd,
        name,
        dryRun: options.dryRun,
        force: options.force,
      });

      stdout.write(formatFeatureCreateResult(result));
    });

  const adrCommand = program.command("adr").description("Manage Recall OS ADR memory.");

  adrCommand
    .command("create")
    .description("Create a proposed ADR.")
    .argument("<title>", "ADR title.")
    .option("--dry-run", "Show planned writes without writing files.")
    .option("--force", "Overwrite existing files explicitly.")
    .action(async (title: string, options: { dryRun?: boolean; force?: boolean }) => {
      const result = await createAdr({
        rootDir: cwd,
        title,
        dryRun: options.dryRun,
        force: options.force,
      });

      stdout.write(formatAdrCreateResult(result));
    });

  const moduleCommand = program.command("module").description("Manage Recall OS module memory.");

  moduleCommand
    .command("create")
    .description("Create module memory docs.")
    .argument("<name>", "Module name.")
    .option("--dry-run", "Show planned writes without writing files.")
    .option("--force", "Overwrite existing files explicitly.")
    .action(async (name: string, options: { dryRun?: boolean; force?: boolean }) => {
      const result = await createModule({
        rootDir: cwd,
        name,
        dryRun: options.dryRun,
        force: options.force,
      });

      stdout.write(formatModuleCreateResult(result));
    });

  program
    .command("doctor")
    .description("Check whether Recall OS repository memory is healthy.")
    .action(async () => {
      const result = await doctorProject({ rootDir: cwd });

      stdout.write(formatDoctorResult(result));
      state.exitCode = result.exitCode;
    });

  const skillCommand = program.command("skill").description("Manage Recall OS agent skills.");

  skillCommand
    .command("create")
    .description("Generate an agent skill for Claude Code and the portable Agent Skills target.")
    .argument("<name>", "Skill name.")
    .option("--dry-run", "Show planned writes without writing files.")
    .option("--force", "Overwrite existing files explicitly.")
    .action(async (name: string, options: { dryRun?: boolean; force?: boolean }) => {
      const result = await createSkill({
        rootDir: cwd,
        name,
        dryRun: options.dryRun,
        force: options.force,
      });

      stdout.write(formatSkillCreateResult(result));
    });

  skillCommand
    .command("list")
    .description("List built-in catalog skills.")
    .action(() => {
      stdout.write(formatSkillListResult());
    });

  const presetCommand = program.command("preset").description("Inspect Recall OS presets.");

  presetCommand
    .command("list")
    .description("List built-in presets.")
    .action(() => {
      stdout.write(formatPresetListResult(listPresetEntries()));
    });

  return program;
}

export async function main(
  argv: string[] = process.argv.slice(2),
  io: CliIo = {},
): Promise<number> {
  const stderr = io.stderr ?? process.stderr;
  const state = { exitCode: 0 };
  const program = createCliProgram(io, state);

  try {
    await program.parseAsync(argv, { from: "user" });
    return state.exitCode;
  } catch (error) {
    if (error instanceof InitError) {
      stderr.write(`${error.message}\n`);
      for (const detail of error.details) {
        stderr.write(`- ${detail}\n`);
      }
      return 1;
    }

    if (error instanceof FeatureCreateError) {
      stderr.write(`${error.message}\n`);
      for (const detail of error.details) {
        stderr.write(`- ${detail}\n`);
      }
      return 1;
    }

    if (error instanceof AdoptError) {
      stderr.write(`${error.message}\n`);
      for (const detail of error.details) {
        stderr.write(`- ${detail}\n`);
      }
      return 1;
    }

    if (error instanceof AdrCreateError) {
      stderr.write(`${error.message}\n`);
      for (const detail of error.details) {
        stderr.write(`- ${detail}\n`);
      }
      return 1;
    }

    if (error instanceof ModuleCreateError) {
      stderr.write(`${error.message}\n`);
      for (const detail of error.details) {
        stderr.write(`- ${detail}\n`);
      }
      return 1;
    }

    if (error instanceof SkillCreateError) {
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
