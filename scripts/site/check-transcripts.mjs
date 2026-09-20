#!/usr/bin/env node
// Every line of every recorded terminal block on the website must exist verbatim in a file under
// scripts/site/recordings/. Allowed exceptions: prompt lines (checked against the recorded
// command, ignoring shell quotes), ellipsis lines marking honest truncation, and [exit N] markers.
//
// Usage, from the repository root:   node scripts/site/check-transcripts.mjs
// Optional arguments: <site dir> <recordings dir>
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const site = process.argv[2] ?? path.join(root, "site");
const rec = process.argv[3] ?? path.join(root, "scripts", "site", "recordings");

const walk = (d) =>
  readdirSync(d).flatMap((n) => {
    const p = path.join(d, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") ? [p] : [];
  });
const unescape = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
const strip = (s) => unescape(s.replace(/<[^>]+>/g, ""));

const recorded = readdirSync(rec)
  .filter((f) => f.endsWith(".txt"))
  .map((f) => readFileSync(path.join(rec, f), "utf8"))
  .join("\n");
const recordedLines = new Set(recorded.split("\n").map((l) => l.replace(/\s+$/, "")));
const recordedCommands = new Set(
  [...recorded.matchAll(/^\$ (.*)$/gm)].map((m) => m[1].replace(/["']/g, "")),
);

// Blocks that are quoted files or hand-written snippets rather than recordings.
const SKIP =
  /^(#!\/bin\/sh|# run without installing|name: Persist OS|# Product:|# Tasks:|# ADR-0001: Use PostgreSQL For Primary Storage\n\n## Status\n\nProposed\n\n## Context|"preCommitGates"|persist init \[|persist adopt \[|persist feature create <|persist adr (create|accept|supersede) <|persist module create <|persist doctor \[|persist test-gate$|persist mcp add <|persist skill create <|docs\/00-product|\.persist\/config\.json|- Languages: TypeScript\n- Package manager: pnpm \(from|Next steps:\n- Fill docs)/;

let checked = 0;
const problems = [];
for (const file of walk(site)) {
  const html = readFileSync(file, "utf8");
  const rel = path.relative(site, file);
  for (const m of html.matchAll(/<pre\b([^>]*)>([\s\S]*?)<\/pre>/g)) {
    const attrs = m[1];
    const body = strip(m[2].replace(/^<code>|<\/code>$/g, ""));
    const isTranscript = /transcript/.test(attrs) || /<span class="p">\$<\/span>/.test(m[2]);
    if (!isTranscript || SKIP.test(body) || /class="diff"/.test(attrs)) continue;
    // A snippet made only of commands (an instruction, not a recording) has no output to verify.
    const lines = body
      .split("\n")
      .map((l) => l.replace(/\s+$/, ""))
      .filter((l) => l !== "");
    if (lines.every((l) => l.startsWith("$ ") || /^\s*#/.test(l))) continue;
    for (const raw of body.split("\n")) {
      const line = raw.replace(/\s+$/, "");
      if (line === "" || /^\s*…/.test(line) || /^\[exit \d\]$/.test(line)) continue;
      checked++;
      if (line.startsWith("$ ")) {
        const cmd = line.slice(2).replace(/["']/g, "");
        if (!recordedCommands.has(cmd)) problems.push(`${rel}: command not recorded: ${line}`);
        continue;
      }
      if (!recordedLines.has(line)) problems.push(`${rel}: line not in any recording: ${line}`);
    }
  }
}
console.log(`checked ${checked} transcript lines against ${recordedLines.size} recorded lines`);
if (problems.length) {
  console.log("PROBLEMS:\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log("OK: every transcript line on the site is verbatim recorded output.");
