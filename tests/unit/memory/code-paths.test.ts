import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { codePathsIn, readCodeRoots } from "../../../src/core/memory/code-paths.js";

/**
 * Memory-to-code checks recognised only `src/` and `tests/`, so in a Next.js app, a monorepo, a
 * Python package, or a Go project they matched nothing and passed without checking anything.
 */
describe("code paths in memory", () => {
  const dirs: string[] = [];

  async function repo(folders: string[]): Promise<string> {
    const root = await mkdtemp(path.join(tmpdir(), "persist-code-paths-"));
    dirs.push(root);
    for (const folder of folders) {
      await mkdir(path.join(root, folder), { recursive: true });
    }
    return root;
  }

  afterEach(async () => {
    await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("recognises the top-level folders of any layout", async () => {
    const root = await repo(["app", "components", "apps", "packages", "cmd", "internal", "mypkg"]);
    const roots = await readCodeRoots(root, "docs");
    const text = [
      "`app/checkout/page.tsx`",
      "`components/ui/Button.tsx`",
      "`apps/web/src/main.ts`",
      "`packages/ui/index.ts`",
      "`cmd/server/main.go`",
      "`internal/billing/ledger.go`",
      "`mypkg/money.py`",
    ].join(" and ");

    expect(codePathsIn(text, roots)).toEqual([
      "app/checkout/page.tsx",
      "components/ui/Button.tsx",
      "apps/web/src/main.ts",
      "packages/ui/index.ts",
      "cmd/server/main.go",
      "internal/billing/ledger.go",
      "mypkg/money.py",
    ]);
  });

  it("always counts src/ and tests/, even when the folder is gone", async () => {
    const roots = await readCodeRoots(await repo([]), "docs");

    expect(codePathsIn("`src/split.ts` `tests/split.test.ts`", roots)).toEqual([
      "src/split.ts",
      "tests/split.test.ts",
    ]);
  });

  it("ignores dependencies, build output, hidden folders, and the memory folder", async () => {
    const root = await repo(["node_modules/x", "dist", ".github", "docs/adrs", "app"]);
    const roots = await readCodeRoots(root, "docs");
    const text =
      "`node_modules/x/index.js` `dist/main.js` `.github/workflows/ci.yml` `docs/adrs/ADR-0001-x.md` `app/page.tsx`";

    expect(codePathsIn(text, roots)).toEqual(["app/page.tsx"]);
  });

  it("follows a moved memory folder", async () => {
    const root = await repo([".memory", "memory", "app"]);
    const roots = await readCodeRoots(root, "memory");

    expect(codePathsIn("`memory/context/x.md` `app/page.tsx`", roots)).toEqual(["app/page.tsx"]);
  });

  it("skips URLs, placeholders, globs, parent paths, and folders that do not exist", async () => {
    const roots = await readCodeRoots(await repo(["app"]), "docs");
    const text =
      "`https://example.com/a.js` `app/<route>/page.tsx` `app/**/page.tsx` `app/.../x.ts` `../other/x.ts` `lodash/fp.js` `app/page.tsx`";

    expect(codePathsIn(text, roots)).toEqual(["app/page.tsx"]);
  });

  it("lists each path once, in order of first mention", async () => {
    const roots = await readCodeRoots(await repo(["app"]), "docs");

    expect(codePathsIn("`app/b.ts` `app/a.ts` `app/b.ts`", roots)).toEqual([
      "app/b.ts",
      "app/a.ts",
    ]);
  });
});
