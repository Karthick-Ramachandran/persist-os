/**
 * The only module in the codebase that contains ANSI escape codes. Every other
 * module styles text exclusively through these helpers, so colour can be
 * audited — and switched off — in one place.
 *
 * Palette is the Persist OS site palette. Depth degrades truecolor → 256 →
 * 16 colours. The 16-colour fallbacks are chosen to read on light and dark
 * terminals alike (ink falls back to the terminal default); meaning is never
 * carried by colour alone.
 */

export type ColorLevel = "none" | "ansi16" | "ansi256" | "truecolor";

type PaletteEntry = {
  truecolor: [number, number, number];
  ansi256: number;
  /** 16-colour SGR code, or null to leave the terminal default (always legible). */
  ansi16: number | null;
};

const PALETTE: Record<string, PaletteEntry> = {
  accent: { truecolor: [181, 64, 26], ansi256: 166, ansi16: 91 },
  secondary: { truecolor: [201, 134, 43], ansi256: 178, ansi16: 33 },
  ink: { truecolor: [243, 236, 227], ansi256: 255, ansi16: null },
  muted: { truecolor: [167, 156, 145], ansi256: 145, ansi16: 90 },
  ok: { truecolor: [63, 111, 31], ansi256: 64, ansi16: 32 },
  warn: { truecolor: [154, 91, 0], ansi256: 136, ansi16: 33 },
  err: { truecolor: [180, 35, 24], ansi256: 160, ansi16: 31 },
  line: { truecolor: [61, 52, 46], ansi256: 59, ansi16: 90 },
};

function paint(level: ColorLevel, entry: PaletteEntry, text: string): string {
  if (level === "none") {
    return text;
  }
  if (level === "truecolor") {
    const [r, g, b] = entry.truecolor;
    return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
  }
  if (level === "ansi256") {
    return `\x1b[38;5;${entry.ansi256}m${text}\x1b[0m`;
  }
  if (entry.ansi16 === null) {
    return text;
  }
  return `\x1b[${entry.ansi16}m${text}\x1b[0m`;
}

export type StyleHelpers = {
  accent(text: string): string;
  secondary(text: string): string;
  ink(text: string): string;
  muted(text: string): string;
  ok(text: string): string;
  warn(text: string): string;
  err(text: string): string;
  line(text: string): string;
  /** Bold, uncoloured. For emphasis that must not read as a status. */
  bold(text: string): string;
  /** Accent headline. */
  heading(text: string): string;
  /** A horizontal rule of box-drawing characters, default 40 wide. */
  rule(width?: number): string;
};

export function createStyle(level: ColorLevel): StyleHelpers {
  const color = (name: keyof typeof PALETTE) => (text: string) => paint(level, PALETTE[name], text);

  return {
    accent: color("accent"),
    secondary: color("secondary"),
    ink: color("ink"),
    muted: color("muted"),
    ok: color("ok"),
    warn: color("warn"),
    err: color("err"),
    line: color("line"),
    bold: (text: string) => (level === "none" ? text : `\x1b[1m${text}\x1b[0m`),
    heading: (text: string) =>
      level === "none" ? text : `\x1b[1m${paint(level, PALETTE.accent, text)}\x1b[0m`,
    rule: (width = 40) =>
      level === "none" ? "─".repeat(width) : paint(level, PALETTE.line, "─".repeat(width)),
  };
}

/**
 * Switch-off order: NO_COLOR (present at all) wins over everything, then
 * TERM=dumb, then FORCE_COLOR (which also enables colour on non-TTY output),
 * then the TTY check with depth sniffed from COLORTERM/TERM.
 */
export function detectColorLevel(
  env: NodeJS.ProcessEnv,
  stdoutTTY: boolean | undefined,
): ColorLevel {
  if ("NO_COLOR" in env) {
    return "none";
  }
  if (env.TERM === "dumb") {
    return "none";
  }

  const forced = env.FORCE_COLOR;
  if (forced !== undefined && forced !== "" && forced !== "0") {
    if (forced === "3") {
      return "truecolor";
    }
    if (forced === "2") {
      return "ansi256";
    }
    return "ansi16";
  }

  if (stdoutTTY !== true) {
    return "none";
  }

  const colorTerm = (env.COLORTERM ?? "").toLowerCase();
  if (colorTerm === "truecolor" || colorTerm === "24bit") {
    return "truecolor";
  }
  if ((env.TERM ?? "").includes("256color")) {
    return "ansi256";
  }
  return "ansi16";
}

/** Style for the current process. Reads the live environment on every call. */
export function getStyle(stdoutTTY?: boolean): StyleHelpers {
  return createStyle(detectColorLevel(process.env, stdoutTTY ?? process.stdout?.isTTY ?? false));
}

const ANSI_PATTERN = /\x1b\[[0-9;]*m/gu;

/** Remove ANSI sequences. Used to prove colour never carries meaning alone. */
export function stripAnsi(text: string): string {
  return text.replace(ANSI_PATTERN, "");
}
