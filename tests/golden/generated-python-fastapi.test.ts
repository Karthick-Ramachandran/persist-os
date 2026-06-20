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

describe("python-fastapi init golden output", () => {
  let rootDir: string | undefined;

  afterEach(async () => {
    if (rootDir !== undefined) {
      await removeTempRoot(rootDir);
      rootDir = undefined;
    }
  });

  it("generates deterministic Python FastAPI guidance and proposed decisions", async () => {
    rootDir = await createTempRoot("golden-python-fastapi");
    const result = await runInitCommand(rootDir, ["--preset", "python-fastapi"]);

    expect(result.exitCode).toBe(0);
    expect(await listRelativeFiles(rootDir)).toContain(
      "docs/adrs/proposed/ADR-PROPOSED-python-fastapi-framework.md",
    );

    const config = await readGeneratedJson<RecallConfig>(rootDir, ".recall/config.json");
    expect(config.preset).toBe("python-fastapi");

    expect(
      await readGeneratedFile(rootDir, "docs/ai/presets/python-fastapi-guidance.md"),
    ).toContain("FastAPI");
    expect(
      await readGeneratedFile(
        rootDir,
        "docs/adrs/proposed/ADR-PROPOSED-python-fastapi-database-postgres.md",
      ),
    ).toContain("## Status\n\nProposed");
  });
});
