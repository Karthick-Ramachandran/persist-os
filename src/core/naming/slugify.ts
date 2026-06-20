const MAX_SLUG_LENGTH = 80;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/u;
const WINDOWS_RESERVED_NAMES = new Set([
  "con",
  "prn",
  "aux",
  "nul",
  "com1",
  "com2",
  "com3",
  "com4",
  "com5",
  "com6",
  "com7",
  "com8",
  "com9",
  "lpt1",
  "lpt2",
  "lpt3",
  "lpt4",
  "lpt5",
  "lpt6",
  "lpt7",
  "lpt8",
  "lpt9"
]);

export class SlugifyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlugifyError";
  }
}

export type SlugifyOptions = {
  maxLength?: number;
};

export function slugify(input: string, options: SlugifyOptions = {}): string {
  const maxLength = options.maxLength ?? MAX_SLUG_LENGTH;

  if (!Number.isInteger(maxLength) || maxLength < 1) {
    throw new SlugifyError("Slug max length must be a positive integer.");
  }

  const original = input;
  const trimmed = original.trim();

  if (trimmed.length === 0) {
    throw new SlugifyError("Name cannot be empty.");
  }

  if (original.endsWith(".") || original.endsWith(" ")) {
    throw new SlugifyError("Name cannot end with a dot or space.");
  }

  if (CONTROL_CHARS.test(original)) {
    throw new SlugifyError("Name cannot contain null bytes or control characters.");
  }

  if (/[\\/]/u.test(original)) {
    throw new SlugifyError("Name cannot contain path separators.");
  }

  if (trimmed === "." || trimmed === ".." || trimmed.includes("..")) {
    throw new SlugifyError("Name cannot contain path traversal.");
  }

  const withoutDiacritics = trimmed.normalize("NFKD").replace(/[\u0300-\u036f]/gu, "");
  const slug = withoutDiacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/-+/gu, "-")
    .replace(/^-|-$/gu, "")
    .slice(0, maxLength)
    .replace(/-$/u, "");

  if (slug.length === 0) {
    throw new SlugifyError("Name must include at least one letter or number.");
  }

  if (WINDOWS_RESERVED_NAMES.has(slug)) {
    throw new SlugifyError(`Name "${slug}" is reserved on Windows.`);
  }

  return slug;
}
