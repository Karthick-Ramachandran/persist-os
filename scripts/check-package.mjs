#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

const [packResult] = JSON.parse(output);
const files = packResult.files.map((file) => file.path).sort();
const fileSet = new Set(files);

const requiredFiles = ["LICENSE", "README.md", "dist/cli.js", "dist/index.js", "package.json"];

// examples/ holds preset-era generated output kept for history; it is not part of the package.
const blockedPrefixes = [
  ".github/",
  ".persist/",
  ".agents/",
  ".claude/",
  "coverage/",
  "docs/",
  "examples/",
  "node_modules/",
  "scripts/",
  "site/",
  "src/",
  "tests/",
];

const missing = requiredFiles.filter((file) => !fileSet.has(file));
const blocked = files.filter((file) => blockedPrefixes.some((prefix) => file.startsWith(prefix)));

if (missing.length > 0 || blocked.length > 0) {
  if (missing.length > 0) {
    console.error("Package dry-run is missing required files:");
    for (const file of missing) {
      console.error(`- ${file}`);
    }
  }

  if (blocked.length > 0) {
    console.error("Package dry-run includes blocked files:");
    for (const file of blocked) {
      console.error(`- ${file}`);
    }
  }

  process.exit(1);
}

console.log(`Package dry-run validated ${files.length} files.`);
