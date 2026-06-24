import { Command, CommanderError } from "commander";

import { acceptAdr, AdrAcceptError, formatAdrAcceptResult } from "../commands/adr/accept.js";
import { createAdr, AdrCreateError, formatAdrCreateResult } from "../commands/adr/create.js";
import {
  supersedeAdr,
  AdrSupersedeError,
  formatAdrSupersedeResult,
} from "../commands/adr/supersede.js";
import {
  createFeature,
  FeatureCreateError,
  formatFeatureCreateResult,
} from "../commands/feature/create.js";
import { adoptProject, AdoptError, formatAdoptResult } from "../commands/adopt.js";
import { doctorProject, formatDoctorResult } from "../commands/doctor.js";
import { runGuard, formatGuardResult } from "../commands/guard.js";
import { formatInitResult, initProject, InitError } from "../commands/init.js";
import { mcpAdd, McpAddError, formatMcpAddResult } from "../commands/mcp/add.js";
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
    .name("persist")
    .description("Initialize and maintain repository memory for AI-assisted software work.")
    .exitOverride()
    .configureOutput({
      writeOut: (message) => stdout.write(message),
      writeErr: (message) => stderr.write(message),
    });

  program
    .command("init")
    .description("Initialize Persist OS repository memory.")
    .option("--preset <id>", "Apply optional preset guidance and proposed decisions.")
    .option(
      "--ai-tools <list>",
      "Comma-separated AI tools to generate files for: claude,codex,cursor,generic.",
    )
    .option("--dry-run", "Show planned writes without writing files.")
    .option("--force", "Overwrite existing files explicitly.")
    .option("--reinit", "Allow --force to overwrite an existing Persist OS installation.")
    .action(
      async (options: {
        preset?: string;
        aiTools?: string;
        dryRun?: boolean;
        force?: boolean;
        reinit?: boolean;
      }) => {
        const aiTools =
          options.aiTools === undefined
            ? undefined
            : [
                ...new Set(
                  options.aiTools
                    .split(",")
                    .map((tool) => tool.trim().toLowerCase())
                    .filter((tool) => tool.length > 0),
                ),
              ];

        const result = await initProject({
          rootDir: cwd,
          preset: options.preset,
          aiTools,
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

  const featureCommand = program
    .command("feature")
    .description("Manage Persist OS feature memory.");

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

  const adrCommand = program.command("adr").description("Manage Persist OS ADR memory.");

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

  adrCommand
    .command("accept")
    .description("Promote a proposed ADR to accepted repository memory.")
    .argument("<name>", "Proposed ADR name or slug, e.g. mcp-figma.")
    .option("--dry-run", "Show planned writes without writing files.")
    .option("--force", "Overwrite existing files explicitly.")
    .action(async (name: string, options: { dryRun?: boolean; force?: boolean }) => {
      const result = await acceptAdr({
        rootDir: cwd,
        name,
        dryRun: options.dryRun,
        force: options.force,
      });

      stdout.write(formatAdrAcceptResult(result));
    });

  adrCommand
    .command("supersede")
    .description(
      "Record a changed decision: mark an accepted ADR superseded by a new accepted ADR.",
    )
    .argument("<old>", "Accepted ADR name or slug being superseded, e.g. database-postgres.")
    .argument("<new-title>", "Title of the new decision that replaces it.")
    .option("--dry-run", "Show planned writes without writing files.")
    .option("--force", "Overwrite existing files explicitly.")
    .action(
      async (oldName: string, newTitle: string, options: { dryRun?: boolean; force?: boolean }) => {
        const result = await supersedeAdr({
          rootDir: cwd,
          oldName,
          newTitle,
          dryRun: options.dryRun,
          force: options.force,
        });

        stdout.write(formatAdrSupersedeResult(result));
      },
    );

  const moduleCommand = program.command("module").description("Manage Persist OS module memory.");

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
    .description("Check whether Persist OS repository memory is healthy.")
    .option("--json", "Emit a machine-readable doctor report.")
    .action(async (options: { json?: boolean }) => {
      const result = await doctorProject({ rootDir: cwd });

      stdout.write(formatDoctorResult(result, { json: options.json }));
      state.exitCode = result.exitCode;
    });

  program
    .command("guard")
    .description("Fail when staged source changes have no accompanying test changes.")
    .option("--source <list>", "Comma-separated source directories to guard, e.g. src,app.")
    .option("--base <ref>", "Compare against a git ref instead of the staged index.")
    .action(async (options: { source?: string; base?: string }) => {
      const source =
        options.source === undefined
          ? undefined
          : options.source
              .split(",")
              .map((dir) => dir.trim())
              .filter((dir) => dir.length > 0);

      const result = await runGuard({ rootDir: cwd, source, base: options.base });

      stdout.write(formatGuardResult(result));
      state.exitCode = result.exitCode;
    });

  const mcpCommand = program.command("mcp").description("Manage Persist OS MCP context memory.");

  mcpCommand
    .command("add")
    .description("Generate proposed, offline memory for an MCP server.")
    .argument("<server>", "MCP server name, e.g. figma.")
    .option("--dry-run", "Show planned writes without writing files.")
    .option("--force", "Overwrite existing files explicitly.")
    .action(async (server: string, options: { dryRun?: boolean; force?: boolean }) => {
      const result = await mcpAdd({
        rootDir: cwd,
        server,
        dryRun: options.dryRun,
        force: options.force,
      });

      stdout.write(formatMcpAddResult(result));
    });

  const skillCommand = program.command("skill").description("Manage Persist OS agent skills.");

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

  const presetCommand = program.command("preset").description("Inspect Persist OS presets.");

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

    if (error instanceof AdrAcceptError) {
      stderr.write(`${error.message}\n`);
      for (const detail of error.details) {
        stderr.write(`- ${detail}\n`);
      }
      return 1;
    }

    if (error instanceof AdrSupersedeError) {
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

    if (error instanceof McpAddError) {
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
