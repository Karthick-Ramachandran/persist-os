import { readFile } from "node:fs/promises";

import {
  ConfigValidationError,
  parseConfig,
  type SpecForgeConfig
} from "../../config/config-schema.js";
import { CONFIG_PATH } from "../../config/load-config.js";
import { resolveSafePath } from "../../filesystem/safe-path.js";
import type { DoctorFinding } from "../doctor-check.js";

export type ConfigCheckResult = {
  config?: SpecForgeConfig;
  findings: DoctorFinding[];
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
            message: "Missing .specforge/config.json.",
            path: CONFIG_PATH
          }
        ]
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
          path: CONFIG_PATH
        }
      ]
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
          message: "SpecForge config validates.",
          path: CONFIG_PATH
        }
      ]
    };
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      return {
        findings: [
          {
            severity: "error",
            check: "config",
            message: error.message,
            path: CONFIG_PATH
          }
        ]
      };
    }

    throw error;
  }
}

