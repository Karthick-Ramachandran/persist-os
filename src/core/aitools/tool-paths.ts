import type { WriteFileInput } from "../filesystem/write-plan.js";

/**
 * Keep only the tool-specific files the repository's selected `aiTools` actually use.
 * Tool-agnostic files (config, docs, `.persist/`, `.github/`, hooks) and `AGENTS.md`
 * are always kept — `AGENTS.md` is the portable floor that Claude imports and that
 * Codex and Cursor auto-load.
 */
export function keepPathForTools(filePath: string, aiTools: readonly string[]): boolean {
  if (filePath === "CLAUDE.md" || filePath.startsWith(".claude/")) {
    return aiTools.includes("claude");
  }
  if (filePath.startsWith(".cursor/")) {
    return aiTools.includes("cursor");
  }
  if (filePath.startsWith(".codex/")) {
    // The prompt hook and its wiring are Codex-only files, like .claude/ is Claude-only.
    return aiTools.includes("codex");
  }
  if (filePath.startsWith(".agents/")) {
    // The portable Agent Skills are how Codex, Cursor, and other AGENTS.md-aware tools
    // consume workflow skills — Cursor has no skills format of its own.
    return aiTools.includes("codex") || aiTools.includes("generic") || aiTools.includes("cursor");
  }
  return true;
}

export function filterFilesForTools(
  files: WriteFileInput[],
  aiTools: readonly string[],
): WriteFileInput[] {
  return files.filter((file) => keepPathForTools(file.path, aiTools));
}
