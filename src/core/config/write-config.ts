import type { WriteResult } from "../filesystem/write-file-safe.js";
import { executeWritePlan } from "../filesystem/write-file-safe.js";
import { createWritePlan } from "../filesystem/write-plan.js";
import { parseConfig, type ConfigWritePolicy, type SpecForgeConfig } from "./config-schema.js";
import { CONFIG_PATH } from "./load-config.js";

export type WriteConfigOptions = {
  dryRun?: boolean;
  force?: boolean;
  policy?: ConfigWritePolicy;
};

export async function writeConfig(
  rootDir: string,
  config: SpecForgeConfig,
  options: WriteConfigOptions = {}
): Promise<WriteResult> {
  const validatedConfig = parseConfig(config);
  const plan = createWritePlan({
    rootDir,
    files: [
      {
        path: CONFIG_PATH,
        content: `${JSON.stringify(validatedConfig, null, 2)}\n`
      }
    ],
    policy: options.policy,
    force: options.force
  });

  return executeWritePlan(plan, { dryRun: options.dryRun });
}
