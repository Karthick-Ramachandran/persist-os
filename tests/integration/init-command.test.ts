import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { FeedOnPrompt } from "../helpers/fake-prompt.js";
import {
  createTempRoot,
  listRelativeFiles,
  readGeneratedFile,
  readGeneratedJson,
  removeTempRoot,
  runInitCommand,
} from "../helpers/init-test-helpers.js";
import type { PersistConfig } from "../../src/core/config/config-schema.js";
import { initProject } from "../../src/commands/init.js";
import { stripAnsi } from "../../src/cli/style.js";

const feeds: FeedOnPrompt[] = [];

function feedFor(lines: string[]): FeedOnPrompt {
  const feed = new FeedOnPrompt(lines);
  feeds.push(feed);
  return feed;
}

describe("init command", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
    for (const feed of feeds.splice(0)) {
      feed.destroyInput();
    }
  });

  it("creates config and repository memory in an empty folder", async () => {
    const rootDir = await createRoot("init-empty");
    const result = await runInitCommand(rootDir);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persist OS init complete.");
    expect(result.stdout).toContain("Created:");

    const config = await readGeneratedJson<PersistConfig>(rootDir, ".persist/config.json");
    expect(config.testCommand).toBeNull();
    expect(config.prePushGates).toEqual([]);
    expect(await readGeneratedFile(rootDir, "AGENTS.md")).toContain("repository memory");
    expect(await readGeneratedFile(rootDir, "docs/00-product/PRODUCT.md")).toContain(
      "Describe what this repository is building",
    );
  });

  it("names every executable file it wrote", async () => {
    const rootDir = await createRoot("init-executables");
    const result = await runInitCommand(rootDir);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Executable files written:");
    expect(result.stdout).toContain(".persist/hooks/pre-commit");
    expect(result.stdout).toContain(".persist/hooks/pre-push");
    expect(result.stdout).toContain("security-review/scripts/scan-secrets.sh");
  });

  it("works in a non-Git directory", async () => {
    const rootDir = await createRoot("init-non-git");
    const result = await runInitCommand(rootDir);
    const files = await listRelativeFiles(rootDir);

    expect(result.exitCode).toBe(0);
    expect(files).toContain(".persist/config.json");
    expect(files).not.toContain(".git/config");
  });

  it("skips existing files by default", async () => {
    const rootDir = await createRoot("init-skip");
    await writeFile(path.join(rootDir, "AGENTS.md"), "custom agents\n", "utf8");

    const result = await runInitCommand(rootDir);

    expect(result.exitCode).toBe(0);
    expect(await readFile(path.join(rootDir, "AGENTS.md"), "utf8")).toBe("custom agents\n");
    expect(result.stdout).toContain("Skipped:");
    expect(result.stdout).toContain("- AGENTS.md");
  });

  it("dry run writes nothing and reports planned files", async () => {
    const rootDir = await createRoot("init-dry-run");
    const result = await runInitCommand(rootDir, ["--dry-run"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Persist OS init dry run complete.");
    expect(result.stdout).toContain("Planned creates:");
    expect(await listRelativeFiles(rootDir)).toEqual([]);
  });

  it("force overwrites explicitly", async () => {
    const rootDir = await createRoot("init-force");
    await writeFile(path.join(rootDir, "AGENTS.md"), "custom agents\n", "utf8");

    const result = await runInitCommand(rootDir, ["--force"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Overwritten:");
    expect(result.stdout).toContain("- AGENTS.md");
    expect(await readFile(path.join(rootDir, "AGENTS.md"), "utf8")).toContain("Agent Instructions");
  });

  it("generates executable pre-commit and pre-push hooks and proposes activation", async () => {
    const rootDir = await createRoot("init-hook");
    const result = await runInitCommand(rootDir);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Pre-commit and pre-push hooks written to .persist/hooks/");
    expect(result.stdout).toContain("git config core.hooksPath .persist/hooks");

    for (const name of ["pre-commit", "pre-push"]) {
      const hookPath = path.join(rootDir, `.persist/hooks/${name}`);
      const hook = await readFile(hookPath, "utf8");
      expect(hook.startsWith("#!/bin/sh")).toBe(true);
      expect((await stat(hookPath)).mode & 0o100).toBe(0o100);
    }

    const preCommit = await readFile(path.join(rootDir, ".persist/hooks/pre-commit"), "utf8");
    const prePush = await readFile(path.join(rootDir, ".persist/hooks/pre-push"), "utf8");
    expect(preCommit).toContain("persist doctor");
    expect(preCommit).not.toContain("persist test-gate");
    expect(prePush).toContain("persist test-gate");
    expect(prePush).not.toContain("persist doctor");

    const config = await readGeneratedJson<PersistConfig>(rootDir, ".persist/config.json");
    expect(config.preCommitGates).toEqual([]);
  });

  it("skips an existing pre-commit hook unless forced", async () => {
    const rootDir = await createRoot("init-hook-skip");
    await mkdir(path.join(rootDir, ".persist/hooks"), { recursive: true });
    await writeFile(path.join(rootDir, ".persist/hooks/pre-commit"), "#!/bin/sh\ncustom\n", "utf8");

    const result = await runInitCommand(rootDir);

    expect(result.exitCode).toBe(0);
    expect(await readFile(path.join(rootDir, ".persist/hooks/pre-commit"), "utf8")).toBe(
      "#!/bin/sh\ncustom\n",
    );
  });

  it("refuses init --force on an existing installation without --reinit", async () => {
    const rootDir = await createRoot("init-force-existing");
    await runInitCommand(rootDir);
    await writeFile(path.join(rootDir, "AGENTS.md"), "custom agents\n", "utf8");

    const result = await runInitCommand(rootDir, ["--force"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(
      "Refusing to re-initialize an existing Persist OS installation.",
    );
    expect(result.stderr).toContain("--reinit");
    expect(await readFile(path.join(rootDir, "AGENTS.md"), "utf8")).toBe("custom agents\n");
  });

  it("allows init --force --reinit on an existing installation", async () => {
    const rootDir = await createRoot("init-force-reinit");
    await runInitCommand(rootDir);
    await writeFile(path.join(rootDir, "AGENTS.md"), "custom agents\n", "utf8");

    const result = await runInitCommand(rootDir, ["--force", "--reinit"]);

    expect(result.exitCode).toBe(0);
    expect(await readFile(path.join(rootDir, "AGENTS.md"), "utf8")).toContain("Agent Instructions");
  });

  it("generates opt-in scaffolding only with --features and --modules", async () => {
    const rootDir = await createRoot("init-optin");
    const plain = await runInitCommand(rootDir);

    expect(plain.exitCode).toBe(0);
    expect(await listRelativeFiles(rootDir)).not.toContain("docs/40-features/README.md");
    expect(await listRelativeFiles(rootDir)).not.toContain("docs/30-modules/README.md");

    const opted = await runInitCommand(rootDir, ["--features", "--modules", "--force", "--reinit"]);

    expect(opted.exitCode).toBe(0);
    expect(await readGeneratedFile(rootDir, "docs/40-features/README.md")).toContain(
      "TEST_PLAN.md",
    );
    expect(await readGeneratedFile(rootDir, "docs/30-modules/README.md")).toContain(
      "Module Memory",
    );
  });

  it("initializes inside existing app folders without requiring framework files", async () => {
    const rootDir = await createRoot("init-existing-app");
    await mkdir(path.join(rootDir, "src"));
    await writeFile(path.join(rootDir, "src", "index.ts"), "export {};\n", "utf8");

    const result = await runInitCommand(rootDir);

    expect(result.exitCode).toBe(0);
    expect(await readFile(path.join(rootDir, "src", "index.ts"), "utf8")).toBe("export {};\n");
    expect(await readGeneratedFile(rootDir, ".persist/config.json")).toContain(
      '"testCommand": null',
    );
  });

  it("takes every default without prompting on --yes", async () => {
    const rootDir = await createRoot("init-yes");

    const result = await runInitCommand(rootDir, ["--yes"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain("Which AI tools?");
    expect(result.stdout).not.toContain("Track features?");
    expect(result.stdout).toContain("Persist OS init complete.");
  });

  it("prompts for nothing when flags are given", async () => {
    const rootDir = await createRoot("init-flags");

    const result = await runInitCommand(rootDir, ["--ai-tools", "codex", "--features"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain("Which AI tools?");
    expect(result.stdout).not.toContain("Track features?");
    expect(result.stdout).not.toContain("Track modules?");
    expect(await listRelativeFiles(rootDir)).toContain("docs/40-features/README.md");
    expect(await listRelativeFiles(rootDir)).not.toContain("docs/30-modules/README.md");
  });

  it("says so when non-TTY stdin takes the defaults", async () => {
    const rootDir = await createRoot("init-nontty");

    const result = await runInitCommand(rootDir);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("stdin is not a TTY");
    expect(result.stdout).toContain("Persist OS init complete.");
  });

  it("writes the config implied by interactive answers", async () => {
    const rootDir = await createRoot("init-answers");
    const feed = feedFor(["codex", "y", "n", "n"]);

    const result = await initProject({
      rootDir,
      stdinTTY: true,
      promptStreams: { input: feed.input, output: feed },
    });

    expect(feed.written()).toContain("Which AI tools?");
    expect(feed.written()).toContain("[1/4]");
    expect(feed.written()).toContain("Track features?");
    expect(feed.written()).toContain("Track modules?");

    const config = await readGeneratedJson<PersistConfig>(rootDir, ".persist/config.json");
    expect(config.aiTools).toEqual(["codex"]);
    expect(config.testCommand).toBeNull();
    expect(result.testCommand).toBeNull();

    const files = await listRelativeFiles(rootDir);
    expect(files).toContain("docs/40-features/README.md");
    expect(files).not.toContain("docs/30-modules/README.md");
  });

  it("still asks on --dry-run without writing anything", async () => {
    const rootDir = await createRoot("init-dryrun-asks");
    const feed = feedFor(["", "n", "n", "n"]);

    const result = await initProject({
      rootDir,
      dryRun: true,
      stdinTTY: true,
      promptStreams: { input: feed.input, output: feed },
    });

    expect(feed.written()).toContain("Which AI tools?");
    expect(result.dryRun).toBe(true);
    expect(await listRelativeFiles(rootDir)).toEqual([]);
  });

  it("opens with the product masthead", async () => {
    const rootDir = await createRoot("init-masthead");

    const result = await runInitCommand(rootDir, ["--yes"]);

    expect(
      result.stdout.startsWith("persist repository memory for AI-assisted software work\n"),
    ).toBe(true);
    expect(result.stdout).toContain("─".repeat(40));
  });

  it("emits zero escape codes with NO_COLOR set", async () => {
    const rootDir = await createRoot("init-nocolor");
    process.env.NO_COLOR = "1";

    try {
      const result = await runInitCommand(rootDir, ["--yes"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain("\x1b");
    } finally {
      delete process.env.NO_COLOR;
    }
  });

  it("emits zero escape codes with TERM=dumb", async () => {
    const rootDir = await createRoot("init-dumb");
    const previous = process.env.TERM;
    process.env.TERM = "dumb";

    try {
      const result = await runInitCommand(rootDir, ["--yes"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain("\x1b");
    } finally {
      if (previous === undefined) {
        delete process.env.TERM;
      } else {
        process.env.TERM = previous;
      }
    }
  });

  it("emits color when forced, and stripping loses nothing", async () => {
    const forcedRoot = await createRoot("init-forcecolor");
    process.env.FORCE_COLOR = "1";

    try {
      const forced = await runInitCommand(forcedRoot, ["--yes"]);

      expect(forced.exitCode).toBe(0);
      expect(forced.stdout).toContain("\x1b");
    } finally {
      delete process.env.FORCE_COLOR;
    }

    const plain = await runInitCommand(await createRoot("init-plain"), ["--yes"]);

    {
      process.env.FORCE_COLOR = "1";
      try {
        const forced = await runInitCommand(await createRoot("init-force-stripped"), ["--yes"]);

        expect(stripAnsi(forced.stdout)).toBe(plain.stdout);
      } finally {
        delete process.env.FORCE_COLOR;
      }
    }
  });
});
