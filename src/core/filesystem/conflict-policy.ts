export type ConflictPolicy = "skip-existing" | "overwrite";

export function shouldOverwriteExisting(policy: ConflictPolicy): boolean {
  return policy === "overwrite";
}

export function resolveConflictPolicy(force = false): ConflictPolicy {
  return force ? "overwrite" : "skip-existing";
}
