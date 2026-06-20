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

describe("iOS Swift init golden output", () => {
  let rootDir: string | undefined;

  afterEach(async () => {
    if (rootDir !== undefined) {
      await removeTempRoot(rootDir);
      rootDir = undefined;
    }
  });

  it("generates deterministic iOS Swift preset guidance and proposed decisions", async () => {
    rootDir = await createTempRoot("golden-ios-swift");
    const result = await runInitCommand(rootDir, ["--preset", "ios-swift"]);

    expect(result.exitCode).toBe(0);
    expect(await listRelativeFiles(rootDir)).toContain(
      "docs/adrs/proposed/ADR-PROPOSED-ios-swift-platform.md"
    );

    const config = await readGeneratedJson<SpecForgeConfig>(
      rootDir,
      ".specforge/config.json"
    );
    expect(config.preset).toBe("ios-swift");
    expect(await readGeneratedFile(rootDir, "docs/ai/presets/ios-swift-guidance.md"))
      .toContain("proposed guidance");
    expect(
      await readGeneratedFile(
        rootDir,
        "docs/adrs/proposed/ADR-PROPOSED-ios-swift-platform.md"
      )
    ).toContain("## Status\n\nProposed");
  });
});
