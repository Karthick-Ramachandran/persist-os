import { describe, expect, it } from "vitest";

import { generateSkillFiles } from "../../../src/core/skills/generate-skill.js";

/**
 * ADR-0012 constraint tests: scripts are read-only and local, verified by tests that
 * fail loudly rather than documentation that asks nicely.
 */
const NETWORK_TOKENS = [
  "curl",
  "wget",
  "ssh",
  "scp",
  "sftp",
  "telnet",
  "ncat",
  "socat",
  "telemetry",
  "http",
  "socket",
  "fetch",
  "XMLHttpRequest",
];

function scanScript(): string {
  const { files } = generateSkillFiles("security-review");
  const script = files.find((file) => file.path.endsWith("scripts/scan-secrets.sh"));

  if (script === undefined) {
    throw new Error("security-review ships no scan script");
  }

  return script.content;
}

describe("skill script constraints", () => {
  it("the scan script carries no network capability", () => {
    const content = scanScript().toLowerCase();

    for (const token of NETWORK_TOKENS) {
      expect(content, `network token "${token}"`).not.toContain(token.toLowerCase());
    }
  });

  it("the scan script writes nothing", () => {
    const content = scanScript();

    expect(content).not.toContain(">");
  });

  it("the skill works with its scripts directory deleted", () => {
    const { files } = generateSkillFiles("security-review");
    const withoutScripts = files.filter((file) => !file.path.includes("/scripts/"));

    expect(withoutScripts.map((file) => file.path)).toEqual([
      ".claude/skills/security-review/SKILL.md",
      ".agents/skills/security-review/SKILL.md",
    ]);

    const skillMd = withoutScripts[0].content;
    expect(skillMd).toContain("scripts/scan-secrets.sh");
    expect(skillMd).toContain("scripts/ is unavailable");
    expect(skillMd).toContain("## Verification");
  });
});
