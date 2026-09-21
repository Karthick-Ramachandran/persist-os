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
import { runTestGate, formatTestGateResult } from "../commands/test-gate.js";
import { formatInitResult, initProject, InitError } from "../commands/init.js";
import { mcpAdd, McpAddError, formatMcpAddResult } from "../commands/mcp/add.js";
import {
  createModule,
  formatModuleCreateResult,
  ModuleCreateError,
} from "../commands/module/create.js";
import {
  createSkill,
  formatSkillCreateResult,
  SkillCreateError,
} from "../commands/skill/create.js";
import { addFence, formatFenceAddResult } from "../commands/fence/add.js";
import { addContext, ContextAddError, formatAddContextResult } from "../commands/context/add.js";
import { formatSyncHooksResult, HooksSyncError, syncHooks } from "../commands/hooks/sync.js";
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
    .option(
      "--ai-tools <list>",
      "Comma-separated AI tools to generate files for: claude,codex,cursor,generic.",
    )
    .option("--features", "Generate opt-in feature workflow scaffolding.")
    .option("--modules", "Generate opt-in module workflow scaffolding.")
    .option("--dry-run", "Show planned writes without writing files.")
    .option("--force", "Overwrite existing files explicitly.")
    .option("--reinit", "Allow --force to overwrite an existing Persist OS installation.")
    .option("--yes", "Take every default without prompting.")
    .option(
      "--no-enable-hooks",
      "Do not switch the git hooks on for this clone (print the command instead).",
    )
    .action(
      async (options: {
        aiTools?: string;
        features?: boolean;
        modules?: boolean;
        dryRun?: boolean;
        force?: boolean;
        reinit?: boolean;
        yes?: boolean;
        enableHooks?: boolean;
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
          aiTools,
          features: options.features,
          modules: options.modules,
          dryRun: options.dryRun,
          force: options.force,
          reinit: options.reinit,
          yes: options.yes,
          enableHooks: options.enableHooks,
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
    .command("test-gate")
    .description("Run the configured test command and require it to pass.")
    .action(async () => {
      const result = await runTestGate({ rootDir: cwd });

      stdout.write(formatTestGateResult(result));
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

  const fenceCommand = program
    .command("fence")
    .description("Record why code is shaped the way it is.");

  fenceCommand
    .command("add")
    .description("Record the human-confirmed reason a path is shaped the way it is.")
    .argument(
      "<path>",
      "Repo-relative path, optionally suffixed with a symbol, e.g. src/a.ts:write.",
    )
    .requiredOption("--why <reason>", "One sentence. Why the code is shaped this way.")
    .option("--by <name>", "Who confirmed the reason.")
    .option("--adr <link>", "A related decision, when one exists.")
    .option("--dry-run", "Show planned writes without writing files.")
    .action(
      async (
        fencedPath: string,
        options: { why: string; by?: string; adr?: string; dryRun?: boolean },
      ) => {
        const result = await addFence({
          rootDir: cwd,
          path: fencedPath,
          why: options.why,
          by: options.by,
          adr: options.adr,
          dryRun: options.dryRun,
        });

        stdout.write(formatFenceAddResult(result));
      },
    );

  const contextCommand = program
    .command("context")
    .description("Record and find area memory (context cards).");

  contextCommand
    .command("add")
    .description("Scaffold a context card for an area of the codebase.")
    .argument("<name>", 'Area name, e.g. "splitting and rounding".')
    .requiredOption("--purpose <purpose>", "One line: what the area is for.")
    .option("--dry-run", "Show planned writes without writing files.")
    .action(
      async (name: string, options: { purpose: string; dryRun?: boolean }) => {
        const result = await addContext({
          rootDir: cwd,
          name,
          purpose: options.purpose,
          dryRun: options.dryRun,
        });

        stdout.write(formatAddContextResult(result));
      },
    );

  const hooksCommand = program
    .command("hooks")
    .description("Manage the generated git and Claude hooks.");

  hooksCommand
    .command("sync")
    .description(
      "Regenerate the generated hooks from .persist/config.json. Never touches docs or config.",
    )
    .option("--dry-run", "Show planned writes without writing files.")
    .action(async (options: { dryRun?: boolean }) => {
      const result = await syncHooks({ rootDir: cwd, dryRun: options.dryRun });

      stdout.write(formatSyncHooksResult(result));
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

    if (error instanceof ContextAddError) {
      stderr.write(`${error.message}\n`);
      for (const detail of error.details) {
        stderr.write(`- ${detail}\n`);
      }
      return 1;
    }

    if (error instanceof HooksSyncError) {
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
