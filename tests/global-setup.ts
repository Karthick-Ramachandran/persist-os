import { execFileSync } from "node:child_process";

/**
 * Build the CLI once, before any test file starts. Tests that run `dist/cli.js` used to rebuild
 * it in their own `beforeAll`, and test files run in parallel: tsup empties `dist/` before
 * writing it, so one file's rebuild could delete the binary another file was running, and CI
 * failed at random with an exit code of 1 or an empty stdout.
 */
export default function setup(): void {
  execFileSync("pnpm", ["build"], { cwd: process.cwd(), stdio: "ignore" });
}
