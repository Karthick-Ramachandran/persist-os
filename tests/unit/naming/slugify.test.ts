import { describe, expect, it } from "vitest";

import { slugify, SlugifyError } from "../../../src/core/naming/slugify.js";

describe("slugify", () => {
  it("normalizes words to lowercase hyphenated slugs", () => {
    expect(slugify("Auth Provider")).toBe("auth-provider");
    expect(slugify("  Auth   Provider 2026")).toBe("auth-provider-2026");
    expect(slugify("Café Billing")).toBe("cafe-billing");
  });

  it("collapses repeated separators and trims hyphens", () => {
    expect(slugify("Auth___Provider!!!")).toBe("auth-provider");
  });

  it("limits slugs to 80 characters without trailing hyphen", () => {
    const slug = slugify(`${"a".repeat(79)} provider`);

    expect(slug).toHaveLength(79);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("rejects empty or meaningless names", () => {
    expect(() => slugify("")).toThrow(SlugifyError);
    expect(() => slugify("   ")).toThrow(SlugifyError);
    expect(() => slugify("!!!")).toThrow(SlugifyError);
  });

  it("rejects path traversal and path separators before normalization", () => {
    expect(() => slugify(".")).toThrow(SlugifyError);
    expect(() => slugify("..")).toThrow(SlugifyError);
    expect(() => slugify("../../evil")).toThrow(SlugifyError);
    expect(() => slugify("feature/name")).toThrow(SlugifyError);
    expect(() => slugify("feature\\name")).toThrow(SlugifyError);
  });

  it("rejects null bytes, control characters, and trailing dot or space", () => {
    expect(() => slugify("evil\u0000name")).toThrow(SlugifyError);
    expect(() => slugify("evil\nname")).toThrow(SlugifyError);
    expect(() => slugify("name.")).toThrow(SlugifyError);
    expect(() => slugify("name ")).toThrow(SlugifyError);
  });

  it("rejects Windows reserved names", () => {
    for (const name of ["CON", "PRN", "AUX", "NUL", "COM1", "COM9", "LPT1", "LPT9"]) {
      expect(() => slugify(name)).toThrow(SlugifyError);
    }
  });
});
