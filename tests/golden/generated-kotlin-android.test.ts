import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  readGeneratedFile,
  readGeneratedJson,
  removeTempRoot,
  runInitCommand,
} from "../helpers/init-test-helpers.js";
import type { RecallConfig } from "../../src/core/config/config-schema.js";

describe("kotlin-android init golden output", () => {
  let rootDir: string | undefined;

  afterEach(async () => {
    if (rootDir !== undefined) {
      await removeTempRoot(rootDir);
      rootDir = undefined;
    }
  });

  it("generates deterministic Kotlin Android guidance and proposed decisions", async () => {
    rootDir = await createTempRoot("golden-kotlin-android");
    const result = await runInitCommand(rootDir, ["--preset", "kotlin-android"]);

    expect(result.exitCode).toBe(0);
    expect(await listRelativeFiles(rootDir)).toContain(
      "docs/adrs/proposed/ADR-PROPOSED-kotlin-android-platform.md",
    );

    const config = await readGeneratedJson<RecallConfig>(rootDir, ".recall/config.json");
    expect(config.preset).toBe("kotlin-android");

    expect(
      await readGeneratedFile(rootDir, "docs/ai/presets/kotlin-android-guidance.md"),
    ).toContain("Jetpack Compose");
    expect(
      await readGeneratedFile(
        rootDir,
        "docs/adrs/proposed/ADR-PROPOSED-kotlin-android-ui-compose.md",
      ),
    ).toContain("## Status\n\nProposed");
  });
});
