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

describe("nextjs init golden output", () => {
  let rootDir: string | undefined;

  afterEach(async () => {
    if (rootDir !== undefined) {
      await removeTempRoot(rootDir);
      rootDir = undefined;
    }
  });

  it("generates deterministic Next.js preset guidance and proposed decisions", async () => {
    rootDir = await createTempRoot("golden-nextjs");
    const result = await runInitCommand(rootDir, ["--preset", "nextjs"]);

    expect(result.exitCode).toBe(0);
    expect(await listRelativeFiles(rootDir)).toContain(
      "docs/adrs/proposed/ADR-PROPOSED-nextjs-framework.md"
    );

    const config = await readGeneratedJson<SpecForgeConfig>(
      rootDir,
      ".specforge/config.json"
    );
    expect(config.preset).toBe("nextjs");
    expect(await readGeneratedFile(rootDir, "docs/ai/presets/nextjs-guidance.md"))
      .toContain("guidance");
    expect(
      await readGeneratedFile(
        rootDir,
        "docs/adrs/proposed/ADR-PROPOSED-nextjs-framework.md"
      )
    ).toContain("## Status\n\nProposed");
  });
});
