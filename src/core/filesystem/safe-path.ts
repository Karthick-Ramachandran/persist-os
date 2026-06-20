import path from "node:path";
import { realpathSync } from "node:fs";

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/u;

export class SafePathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SafePathError";
  }
}

export type SafePath = {
  path: string;
  absolutePath: string;
};

export function normalizeOutputPath(relativePath: string): string {
  if (relativePath.length === 0) {
    throw new SafePathError("Path cannot be empty.");
  }

  if (CONTROL_CHARS.test(relativePath)) {
    throw new SafePathError("Path cannot contain null bytes or control characters.");
  }

  if (relativePath.includes("\\")) {
    throw new SafePathError("Path must use forward slashes.");
  }

  if (path.posix.isAbsolute(relativePath) || path.win32.isAbsolute(relativePath)) {
    throw new SafePathError("Path must be relative.");
  }

  const segments = relativePath.split("/");

  if (segments.some((segment) => segment.length === 0)) {
    throw new SafePathError("Path cannot contain empty segments.");
  }

  if (segments.some((segment) => segment === "..")) {
    throw new SafePathError("Path cannot contain path traversal.");
  }

  const normalized = path.posix.normalize(relativePath);

  if (normalized === "." || normalized.startsWith("../") || normalized === "..") {
    throw new SafePathError("Path cannot escape the project root.");
  }

  return normalized;
}

export function resolveSafePath(rootDir: string, relativePath: string): SafePath {
  const normalizedPath = normalizeOutputPath(relativePath);
  const absoluteRoot = realpathSync.native(rootDir);
  const absolutePath = path.resolve(absoluteRoot, normalizedPath);
  const relativeToRoot = path.relative(absoluteRoot, absolutePath);

  if (
    relativeToRoot === "" ||
    relativeToRoot.startsWith("..") ||
    path.isAbsolute(relativeToRoot)
  ) {
    throw new SafePathError("Resolved path must stay inside the project root.");
  }

  return {
    path: normalizedPath,
    absolutePath
  };
}
