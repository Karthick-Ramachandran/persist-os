import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  readGeneratedFile,
  readGeneratedJson,
  removeTempRoot,
  runInitCommand
} from "../helpers/init-test-helpers.js";
import type { SpecForgeConfig } from "../../src/core/config/config-schema.js";

describe("Flutter init golden output", () => {
  let rootDir: string | undefined;

  afterEach(async () => {
    if (rootDir !== undefined) {
      await removeTempRoot(rootDir);
      rootDir = undefined;
    }
  });

  it("generates deterministic Flutter preset guidance and proposed decisions", async () => {
    rootDir = await createTempRoot("golden-flutter");
    const result = await runInitCommand(rootDir, ["--preset", "flutter"]);

    expect(result.exitCode).toBe(0);
    expect(await listRelativeFiles(rootDir)).toContain(
      "docs/adrs/proposed/ADR-PROPOSED-flutter-platform.md"
    );

    const config = await readGeneratedJson<SpecForgeConfig>(
      rootDir,
      ".specforge/config.json"
    );
    expect(config.preset).toBe("flutter");
    expect(await readGeneratedFile(rootDir, "docs/ai/presets/flutter-guidance.md"))
      .toContain("proposed guidance");
    expect(
      await readGeneratedFile(
        rootDir,
        "docs/adrs/proposed/ADR-PROPOSED-flutter-platform.md"
      )
    ).toContain("## Status\n\nProposed");
  });
});
