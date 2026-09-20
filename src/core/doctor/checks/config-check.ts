import { readFile } from "node:fs/promises";

import {
  ConfigValidationError,
  parseConfig,
  type PersistConfig,
} from "../../config/config-schema.js";
import { CONFIG_PATH } from "../../config/load-config.js";
import { resolveSafePath } from "../../filesystem/safe-path.js";
import type { DoctorFinding } from "../doctor-check.js";

export type ConfigCheckResult = {
  config?: PersistConfig;
  findings: DoctorFinding[];
  /**
   * Why the config is unusable, when it is. Returned as data so callers can explain a partial
   * doctor run without string-matching finding messages.
   */
  unavailableReason?: string;
};

export async function checkConfig(rootDir: string): Promise<ConfigCheckResult> {
  const configPath = resolveSafePath(rootDir, CONFIG_PATH);

  let rawConfig: string;
  try {
    rawConfig = await readFile(configPath.absolutePath, "utf8");
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return {
        findings: [
          {
            severity: "error",
            check: "config",
            message: "Missing .persist/config.json.",
            path: CONFIG_PATH,
          },
        ],
        unavailableReason: "no .persist/config.json, so configured paths are unknown",
      };
    }
    throw error;
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawConfig);
  } catch {
    return {
      findings: [
        {
          severity: "error",
          check: "config",
          message: "Config file is not valid JSON.",
          path: CONFIG_PATH,
        },
      ],
      unavailableReason: ".persist/config.json is not valid JSON, so configured paths are unknown",
    };
  }

  try {
    const config = parseConfig(parsedJson);

    return {
      config,
      findings: [
        {
          severity: "info",
          check: "config",
          message: "Persist OS config validates.",
          path: CONFIG_PATH,
        },
      ],
    };
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      return {
        findings: [
          {
            severity: "error",
            check: "config",
            message: error.message,
            path: CONFIG_PATH,
          },
        ],
        unavailableReason: "invalid .persist/config.json, so configured paths are unknown",
      };
    }

    throw error;
  }
}
