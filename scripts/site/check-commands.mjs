#!/usr/bin/env node
// Verifies every `persist …` invocation shown as code on the website against the built CLI's
// --help surface, and flags retired vocabulary anywhere in the visible text.
//
// Usage, from the repository root:   pnpm build && node scripts/site/check-commands.mjs
// Optional arguments: <site dir> <cli.js>
import { readFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const site = process.argv[2] ?? path.join(root, "site");
const cli = process.argv[3] ?? path.join(root, "dist", "cli.js");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") ? [p] : [];
  });
}

function help(args) {
  return execFileSync("node", [cli, ...args, "--help"], { encoding: "utf8" });
}

function listCommands(text) {
  const section = text.split(/^Commands:$/m)[1];
  if (!section) return [];
  return [...section.matchAll(/^\s{2}([a-z-]+)\b/gm)].map((m) => m[1]).filter((c) => c !== "help");
}

function options(text) {
  return new Set([...text.matchAll(/(--[a-z-]+)/g)].map((m) => m[1]));
}

// Build the surface from --help: leaf commands with their options.
const surface = new Map();
for (const c of listCommands(help([]))) {
  const h = help([c]);
  const subs = listCommands(h);
  // The parent is always registered too: some commands (context) take their own
  // argument and options alongside subcommands.
  surface.set(c, options(h));
  if (subs.length > 0) {
    for (const s of subs) surface.set(`${c} ${s}`, options(help([c, s])));
  }
}

const unescape = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
const strip = (s) => unescape(s.replace(/<[^>]+>/g, ""));

const problems = [];
const seen = new Set();

for (const file of walk(site)) {
  const rel = path.relative(site, file);
  const html = readFileSync(file, "utf8");
  const visible = strip(
    html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, ""),
  );
  for (const word of ["preset", "guard"]) {
    const hits = visible.match(new RegExp(`\\b${word}s?\\b`, "gi"));
    if (hits) problems.push(`${rel}: retired word "${word}" appears ${hits.length}x`);
  }
  // Only code is checked as a command: <code>…</code> and <pre>…</pre>.
  const snippets = [...html.matchAll(/<(code|pre)\b[^>]*>([\s\S]*?)<\/\1>/g)].map((m) =>
    strip(m[2]).replace(/\s+/g, " "),
  );
  for (const snippet of snippets) {
    // A quoted generated file (the SessionStart hook) is verbatim tool output, not a command list.
    if (snippet.startsWith("#!/bin/sh")) continue;
    // The CLI masthead ("persist repository memory for …") is output, not a command.
    const scanned = snippet.replace(/persist repository memory for AI-assisted software work/g, "");
    for (const m of scanned.matchAll(
      /\bpersist ((?:[a-z-]+)(?: [a-z-]+)?)((?: --[a-z-]+(?:[ =][^ ]+)?)*)/g,
    )) {
      const words = m[1].split(" ");
      const key = surface.has(words.join(" "))
        ? words.join(" ")
        : surface.has(words[0])
          ? words[0]
          : null;
      if (words[0] === "--help") continue;
      if (!key) {
        problems.push(`${rel}: unknown command "persist ${m[1]}" in: ${snippet.slice(0, 80)}`);
        continue;
      }
      seen.add(key);
      for (const o of (m[2] || "")
        .trim()
        .split(/\s+/)
        .filter((t) => t.startsWith("--"))) {
        if (o !== "--help" && !surface.get(key).has(o)) {
          problems.push(`${rel}: "${o}" is not an option of persist ${key}`);
        }
      }
    }
  }
}

console.log("surface from --help:", [...surface.keys()].join(", "));
console.log("commands used on site:", [...seen].join(", "));
const missing = [...surface.keys()].filter((k) => !seen.has(k));
if (missing.length) console.log("on --help but not on site:", missing.join(", "));
if (problems.length) {
  console.log("PROBLEMS:\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log(
  "OK: every persist command and option shown as code exists in --help; no retired words.",
);
