/**
 * Single source of truth for the current Persist OS version.
 * Keep in sync with package.json `version` — `config-schema.test.ts` enforces this
 * so templateVersion can never silently freeze again (see B5).
 */
export const PERSIST_VERSION = "1.4.0";
