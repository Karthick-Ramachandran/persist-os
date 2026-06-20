const TEMPLATE_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/u;
const RESERVED_TEMPLATE_KEYS = new Set(["constructor", "__proto__", "prototype"]);

export type TemplateValue = string | number | boolean;
export type TemplateContext = Readonly<Record<string, TemplateValue>>;

export class TemplateRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TemplateRenderError";
  }
}

function isTemplateValue(value: unknown): value is TemplateValue {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function validateTemplateKey(key: string): void {
  if (!TEMPLATE_KEY_PATTERN.test(key)) {
    throw new TemplateRenderError(
      `Invalid template key "${key}". Keys must match [A-Za-z][A-Za-z0-9_]*.`
    );
  }

  if (RESERVED_TEMPLATE_KEYS.has(key)) {
    throw new TemplateRenderError(`Invalid template key "${key}". Key is reserved.`);
  }
}

export function createTemplateContext(
  values: Readonly<Record<string, unknown>>
): TemplateContext {
  if (values === null || typeof values !== "object" || Array.isArray(values)) {
    throw new TemplateRenderError("Template context must be an object.");
  }

  const context = Object.create(null) as Record<string, TemplateValue>;

  for (const [key, value] of Object.entries(values)) {
    validateTemplateKey(key);

    if (!isTemplateValue(value)) {
      throw new TemplateRenderError(
        `Invalid value for template key "${key}". Values must be strings, numbers, or booleans.`
      );
    }

    context[key] = value;
  }

  return Object.freeze(context);
}
