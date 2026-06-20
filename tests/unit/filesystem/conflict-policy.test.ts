import { describe, expect, it } from "vitest";

import {
  resolveConflictPolicy,
  shouldOverwriteExisting
} from "../../../src/core/filesystem/conflict-policy.js";

describe("conflict policy", () => {
  it("uses skip-existing by default", () => {
    expect(resolveConflictPolicy()).toBe("skip-existing");
    expect(shouldOverwriteExisting("skip-existing")).toBe(false);
  });

  it("uses overwrite only when force is explicit", () => {
    expect(resolveConflictPolicy(true)).toBe("overwrite");
    expect(shouldOverwriteExisting("overwrite")).toBe(true);
  });
});
