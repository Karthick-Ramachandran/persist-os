import { describe, expect, it } from "vitest";

import { isTestFile } from "../../../src/core/naming/test-files.js";

describe("isTestFile", () => {
  it("recognizes test files across ecosystems by filename", () => {
    const tests = [
      "internal/handler/user_test.go",
      "src/sum.test.ts",
      "src/sum.spec.tsx",
      "app/tests/test_health.py",
      "billing_test.py",
      "src/main/UserServiceTest.java",
      "app/Models/UserTest.php",
      "spec/models/user_spec.rb",
    ];
    for (const file of tests) {
      expect(isTestFile(file), file).toBe(true);
    }
  });

  it("recognizes files under a conventional test directory", () => {
    expect(isTestFile("tests/fixtures/data.json")).toBe(true);
    expect(isTestFile("app/__tests__/helper.js")).toBe(true);
    expect(isTestFile("test/setup.rb")).toBe(true);
  });

  it("rejects plain source files", () => {
    const sources = ["src/sum.ts", "app/Models/User.php", "internal/handler/user.go", "main.py"];
    for (const file of sources) {
      expect(isTestFile(file), file).toBe(false);
    }
  });
});
