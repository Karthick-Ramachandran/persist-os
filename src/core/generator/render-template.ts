import {
  createTemplateContext,
  TemplateRenderError,
  type TemplateContext,
  type TemplateValue
} from "./template-context.js";

const TEMPLATE_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/u;
const RESERVED_TEMPLATE_KEYS = new Set(["constructor", "__proto__", "prototype"]);
const EXECUTION_MARKERS = ["<%", "%>"];
const LOGIC_MARKERS = ["{{#", "{{/", "{{^", "{{>"];

function validatePlaceholderKey(key: string): void {
  if (!TEMPLATE_KEY_PATTERN.test(key)) {
    throw new TemplateRenderError(
      `Invalid placeholder "${key}". Placeholders must match [A-Za-z][A-Za-z0-9_]*.`
    );
  }

  if (RESERVED_TEMPLATE_KEYS.has(key)) {
    throw new TemplateRenderError(`Invalid placeholder "${key}". Placeholder is reserved.`);
  }
}

function stringifyTemplateValue(value: TemplateValue): string {
  return String(value);
}

function rejectUnsupportedSyntax(template: string): void {
  for (const marker of EXECUTION_MARKERS) {
    if (template.includes(marker)) {
      throw new TemplateRenderError(
        `Unsupported template syntax "${marker}". Template execution is not supported.`
      );
    }
  }

  for (const marker of LOGIC_MARKERS) {
    if (template.includes(marker)) {
      throw new TemplateRenderError(
        `Unsupported template syntax "${marker}". Template logic is not supported.`
      );
    }
  }
}

export function renderTemplate(template: string, context: TemplateContext): string {
  if (typeof template !== "string") {
    throw new TemplateRenderError("Template must be a string.");
  }

  const safeContext = createTemplateContext(context);
  rejectUnsupportedSyntax(template);

  let output = "";
  let cursor = 0;

  while (cursor < template.length) {
    const openingIndex = template.indexOf("{{", cursor);
    const closingIndex = template.indexOf("}}", cursor);

    if (closingIndex !== -1 && (openingIndex === -1 || closingIndex < openingIndex)) {
      throw new TemplateRenderError("Invalid template syntax: unmatched closing braces.");
    }

    if (openingIndex === -1) {
      output += template.slice(cursor);
      break;
    }

    output += template.slice(cursor, openingIndex);

    const placeholderEnd = template.indexOf("}}", openingIndex + 2);

    if (placeholderEnd === -1) {
      throw new TemplateRenderError("Invalid template syntax: unmatched opening braces.");
    }

    const placeholder = template.slice(openingIndex + 2, placeholderEnd).trim();

    if (placeholder.length === 0) {
      throw new TemplateRenderError("Invalid template syntax: placeholder cannot be empty.");
    }

    validatePlaceholderKey(placeholder);

    if (!Object.prototype.hasOwnProperty.call(safeContext, placeholder)) {
      throw new TemplateRenderError(`Missing template value for "${placeholder}".`);
    }

    output += stringifyTemplateValue(safeContext[placeholder]);
    cursor = placeholderEnd + 2;
  }

  return output;
}
