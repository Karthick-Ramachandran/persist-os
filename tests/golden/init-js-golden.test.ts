import { writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { PERSIST_VERSION } from "../../src/core/version.js";
import {
  createTempRoot,
  readGeneratedFile,
  removeTempRoot,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

/**
 * A JavaScript-only repository produces byte-identical config and init output to 1.4.1: the
 * multi-stack detection in 1.5.0 only adds earlier-precedence stacks, so with no other manifest
 * present the `package.json` proposal — and every printed line — is exactly what it was. The
 * two version stamps are the release version itself, so they track `PERSIST_VERSION`; every
 * other byte is pinned. Captured from a 1.4.1 run, verified green against the pre-change code.
 */
describe("JavaScript-only init is byte-identical to 1.4.1", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("writes the 1.4.1 config bytes and prints the 1.4.1 output", async () => {
    const rootDir = await createRoot("golden-js");
    await writeFile(
      path.join(rootDir, "package.json"),
      JSON.stringify({
        name: "acme",
        scripts: { test: "jest", typecheck: "tsc --noEmit", lint: "eslint ." },
      }),
      "utf8",
    );
    await writeFile(path.join(rootDir, "pnpm-lock.yaml"), "{}", "utf8");

    const result = await runInitCommand(rootDir, ["--yes"]);

    expect(result.exitCode).toBe(0);
    expect(await readGeneratedFile(rootDir, ".persist/config.json")).toBe(EXPECTED_CONFIG);
    expect(result.stdout).toBe(EXPECTED_STDOUT);
  });
});

const EXPECTED_CONFIG = `{
  "version": "${PERSIST_VERSION}",
  "templateVersion": "${PERSIST_VERSION}",
  "aiTools": [
    "claude",
    "codex",
    "cursor"
  ],
  "docsDir": "docs",
  "featuresDir": "docs/40-features",
  "modulesDir": "docs/30-modules",
  "adrDir": "docs/adrs",
  "preCommitGates": [],
  "prePushGates": [
    "pnpm run typecheck",
    "pnpm run lint"
  ],
  "testCommand": "pnpm run test",
  "fenceEnabled": true,
  "contextHook": true
}
`;

const EXPECTED_STDOUT = `persist repository memory for AI-assisted software work
────────────────────────────────────────
Persist OS init complete.
Test gate: pnpm run test (saved as testCommand in .persist/config.json).
Chesterton fence: enabled (record why code is shaped this way in docs/60-engineering/FENCES.md; toggle fenceEnabled in .persist/config.json).
Generated repository memory, 12 agent skills (.claude/skills/ and .agents/skills/), pre-commit and pre-push hooks, a CI workflow, a Claude SessionStart hook, and a Cursor rule that load memory automatically.
Created:
- .persist/config.json
- AGENTS.md
- CLAUDE.md
- .cursor/rules/persist-memory.mdc
- docs/00-product/PRODUCT.md
- docs/20-security/SECURITY_MODEL.md
- docs/50-quality/QUALITY_GATES.md
- docs/60-engineering/ENGINEERING_STANDARDS.md
- docs/60-engineering/CONVENTIONS.md
- docs/60-engineering/LESSONS.md
- docs/adrs/README.md
- .github/workflows/persist.yml
- .persist/hooks/pre-commit
- .persist/hooks/pre-push
- .claude/hooks/session-start.sh
- .claude/settings.json
- .claude/hooks/context-prompt.sh
- .codex/hooks/context-prompt.sh
- .codex/hooks.json
- .claude/skills/implement-task/SKILL.md
- .agents/skills/implement-task/SKILL.md
- .claude/skills/write-tests/SKILL.md
- .agents/skills/write-tests/SKILL.md
- .claude/skills/create-adr/SKILL.md
- .agents/skills/create-adr/SKILL.md
- .claude/skills/drift-review/SKILL.md
- .agents/skills/drift-review/SKILL.md
- .claude/skills/completion-report/SKILL.md
- .agents/skills/completion-report/SKILL.md
- .claude/skills/plan-feature/SKILL.md
- .agents/skills/plan-feature/SKILL.md
- .claude/skills/security-review/SKILL.md
- .agents/skills/security-review/SKILL.md
- .claude/skills/security-review/scripts/scan-secrets.sh
- .agents/skills/security-review/scripts/scan-secrets.sh
- .claude/skills/conventions-adherence/SKILL.md
- .agents/skills/conventions-adherence/SKILL.md
- .claude/skills/chestertons-fence/SKILL.md
- .agents/skills/chestertons-fence/SKILL.md
- .claude/skills/adr-compliance/SKILL.md
- .agents/skills/adr-compliance/SKILL.md
- .claude/skills/context/SKILL.md
- .agents/skills/context/SKILL.md

Executable files written: .persist/hooks/pre-commit, .persist/hooks/pre-push, .claude/hooks/session-start.sh, .claude/hooks/context-prompt.sh, .codex/hooks/context-prompt.sh, .claude/skills/security-review/scripts/scan-secrets.sh, and .agents/skills/security-review/scripts/scan-secrets.sh.

Detected in this repository (proposed — review, nothing was accepted):
- Languages: JavaScript
- Package manager: pnpm (from \`pnpm-lock.yaml\`)
- Frameworks: none detected
- Tests: detected via \`"test"\` script in package.json
If any signal is wrong, correct the source file noted. Run \`persist adopt\` to record this as proposed memory.

Pre-commit and pre-push hooks written to .persist/hooks/ (pre-push is the final regression gate before you push).
Not a git repository yet. After git init, switch the hooks on: git config core.hooksPath .persist/hooks

Next steps:
- Read CLAUDE.md and AGENTS.md, then the docs/ memory they point to.
- AI agent skills are in .claude/skills/ and .agents/skills/ — restart your AI tool to load them.
- Memory loads automatically per tool: a Claude SessionStart hook (.claude/hooks/session-start.sh), a Cursor rule (.cursor/rules/persist-memory.mdc), and AGENTS.md for Codex.
- CI is wired in .github/workflows/persist.yml; the pre-commit hook is in .persist/hooks/.
- Plan your first feature: persist feature create <name>.
- Record a decision: persist adr create <title>, then accept it with persist adr accept.
- Check repository memory health anytime: persist doctor.
`;
