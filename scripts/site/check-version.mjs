#!/usr/bin/env node
// The site states a version in exactly one place — the footer badge in
// site/index.html — and it drifted for five releases because nothing checked
// it. This checker reads `version` from package.json, finds the badge, and
// exits non-zero with both values when they disagree. A missing badge or a
// duplicated one also fails: a silent pass is the failure mode being fixed.
//
// Usage, from the repository root:   node scripts/site/check-version.mjs
// Optional arguments: <site dir> <package.json path>
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const site = process.argv[2] ?? path.join(root, "site");
const packageFile = process.argv[3] ?? path.join(root, "package.json");

const expected = `v${JSON.parse(readFileSync(packageFile, "utf8")).version}`;
const html = readFileSync(path.join(site, "index.html"), "utf8");

const badges = [...html.matchAll(/<span class="version-badge">(.*?)<\/span>/g)].map((m) => m[1]);

if (badges.length === 0) {
  console.log('PROBLEMS:\n- site/index.html carries no <span class="version-badge"> badge.');
  process.exit(1);
}
if (badges.length > 1) {
  console.log(
    `PROBLEMS:\n- site/index.html carries ${badges.length} version badges (${badges.join(", ")}); exactly one is expected.`,
  );
  process.exit(1);
}

const [badge] = badges;
if (badge !== expected) {
  console.log(
    `PROBLEMS:\n- site badge is ${badge} but package.json version is ${expected}; set the badge to the current version.`,
  );
  process.exit(1);
}
console.log(`OK: site badge ${badge} matches package.json version.`);
