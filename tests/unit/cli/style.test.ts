import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createStyle, detectColorLevel, stripAnsi } from "../../../src/cli/style.js";

describe("color switch-off", () => {
  it("NO_COLOR set to anything disables every escape", () => {
    expect(detectColorLevel({ NO_COLOR: "1" }, true)).toBe("none");
    expect(detectColorLevel({ NO_COLOR: "" }, true)).toBe("none");
    expect(detectColorLevel({ NO_COLOR: "1", FORCE_COLOR: "1" }, true)).toBe("none");
  });

  it("non-TTY stdout disables color", () => {
    expect(detectColorLevel({}, false)).toBe("none");
    expect(detectColorLevel({}, undefined)).toBe("none");
  });

  it("TERM=dumb disables color", () => {
    expect(detectColorLevel({ TERM: "dumb" }, true)).toBe("none");
  });

  it("FORCE_COLOR enables color even off-TTY", () => {
    expect(detectColorLevel({ FORCE_COLOR: "1" }, false)).toBe("ansi16");
    expect(detectColorLevel({ FORCE_COLOR: "2" }, false)).toBe("ansi256");
    expect(detectColorLevel({ FORCE_COLOR: "3" }, false)).toBe("truecolor");
  });

  it("sniffs depth on a TTY", () => {
    expect(detectColorLevel({ COLORTERM: "truecolor" }, true)).toBe("truecolor");
    expect(detectColorLevel({ COLORTERM: "24bit" }, true)).toBe("truecolor");
    expect(detectColorLevel({ TERM: "xterm-256color" }, true)).toBe("ansi256");
    expect(detectColorLevel({ TERM: "xterm" }, true)).toBe("ansi16");
  });
});

describe("palette", () => {
  it("emits no codes at level none", () => {
    const style = createStyle("none");

    for (const paint of [
      style.accent,
      style.secondary,
      style.ink,
      style.muted,
      style.ok,
      style.warn,
      style.err,
      style.line,
      style.heading,
    ]) {
      expect(paint("text")).toBe("text");
    }
    expect(style.rule()).toBe("─".repeat(40));
  });

  it("keeps ink legible by falling back to the terminal default at 16 colors", () => {
    expect(createStyle("ansi16").ink("text")).toBe("text");
  });

  it("uses both-legible 16-color codes for status colors", () => {
    const style = createStyle("ansi16");

    expect(style.err("x")).toBe("\x1b[31mx\x1b[0m");
    expect(style.ok("x")).toBe("\x1b[32mx\x1b[0m");
    expect(style.warn("x")).toBe("\x1b[33mx\x1b[0m");
    expect(style.muted("x")).toBe("\x1b[90mx\x1b[0m");
    expect(style.accent("x")).toBe("\x1b[91mx\x1b[0m");
  });

  it("renders the exact configured sequences", () => {
    expect(createStyle("truecolor").accent("x")).toBe("\x1b[38;2;181;64;26mx\x1b[0m");
    expect(createStyle("ansi256").accent("x")).toBe("\x1b[38;5;166mx\x1b[0m");
  });

  it("stripAnsi restores the plain words", () => {
    const style = createStyle("ansi16");

    expect(stripAnsi(`${style.heading("Hello")} ${style.ok("world")}`)).toBe("Hello world");
  });
});

describe("rendering snapshot", () => {
  it("keeps the plain rendering word-identical", () => {
    const plain = createStyle("none");

    expect(`${plain.heading("persist")} ${plain.muted("tagline")}\n${plain.rule(8)}`).toBe(
      "persist tagline\n────────",
    );
  });
});

describe("escape containment", () => {
  it("keeps escape codes in exactly one module", async () => {
    const offenders: string[] = [];

    async function walk(dir: string): Promise<void> {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else if (entry.name.endsWith(".ts") && full !== path.join("src", "cli", "style.ts")) {
          const content = await readFile(full, "utf8");
          if (content.includes("\x1b") || /\u001b/u.test(content)) {
            offenders.push(full);
          }
        }
      }
    }

    await walk("src");

    expect(offenders).toEqual([]);
  });
});
