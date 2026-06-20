import { describe, expect, it } from "vitest";

import { renderTemplate } from "../../../src/core/generator/render-template.js";
import {
  createTemplateContext,
  TemplateRenderError
} from "../../../src/core/generator/template-context.js";

describe("renderTemplate", () => {
  it("renders basic placeholders", () => {
    const context = createTemplateContext({ name: "SpecForge" });

    expect(renderTemplate("Project: {{name}}", context)).toBe("Project: SpecForge");
  });

  it("renders placeholders with surrounding whitespace", () => {
    const context = createTemplateContext({ name: "SpecForge" });

    expect(renderTemplate("Project: {{ name }}", context)).toBe("Project: SpecForge");
  });

  it("renders repeated placeholders consistently", () => {
    const context = createTemplateContext({ name: "SpecForge" });

    expect(renderTemplate("{{name}} / {{ name }}", context)).toBe(
      "SpecForge / SpecForge"
    );
  });

  it("renders string, number, and boolean values deterministically", () => {
    const context = createTemplateContext({
      name: "SpecForge",
      version: 3,
      enabled: true
    });

    expect(renderTemplate("{{name}} {{version}} {{enabled}}", context)).toBe(
      "SpecForge 3 true"
    );
  });

  it("renders multiline values as text", () => {
    const context = createTemplateContext({ body: "line one\nline two" });

    expect(renderTemplate("# Notes\n{{body}}\n", context)).toBe(
      "# Notes\nline one\nline two\n"
    );
  });

  it("allows unused context keys", () => {
    const context = createTemplateContext({ used: "yes", unused: "allowed" });

    expect(renderTemplate("{{used}}", context)).toBe("yes");
  });

  it("fails clearly on missing values", () => {
    const context = createTemplateContext({ name: "SpecForge" });

    expect(() => renderTemplate("{{missing}}", context)).toThrow(TemplateRenderError);
    expect(() => renderTemplate("{{missing}}", context)).toThrow(
      'Missing template value for "missing".'
    );
  });

  it("fails clearly on invalid placeholder syntax", () => {
    const context = createTemplateContext({ name: "SpecForge" });

    expect(() => renderTemplate("{{}}", context)).toThrow(TemplateRenderError);
    expect(() => renderTemplate("{{user.name}}", context)).toThrow(TemplateRenderError);
    expect(() => renderTemplate("{{user[name]}}", context)).toThrow(
      TemplateRenderError
    );
    expect(() => renderTemplate("{{name | upper}}", context)).toThrow(
      TemplateRenderError
    );
    expect(() => renderTemplate("{{name}", context)).toThrow(TemplateRenderError);
    expect(() => renderTemplate("name}}", context)).toThrow(TemplateRenderError);
  });

  it("rejects logic and execution syntax", () => {
    const context = createTemplateContext({ name: "SpecForge" });

    for (const template of [
      "<%= name %>",
      "{{#items}}",
      "{{/items}}",
      "{{^items}}",
      "{{> partial}}"
    ]) {
      expect(() => renderTemplate(template, context)).toThrow(TemplateRenderError);
    }
  });

  it("rejects prototype-adjacent placeholder keys", () => {
    const context = createTemplateContext({ name: "SpecForge" });

    for (const key of ["constructor", "__proto__", "prototype"]) {
      expect(() => renderTemplate(`{{${key}}}`, context)).toThrow(
        TemplateRenderError
      );
    }
  });

  it("renders code-like strings as plain text", () => {
    const context = createTemplateContext({ body: "${process.env.SECRET}" });

    expect(renderTemplate("{{body}}", context)).toBe("${process.env.SECRET}");
  });
});

describe("createTemplateContext", () => {
  it("validates context keys before rendering", () => {
    for (const key of ["invalid-key", "user.name", "constructor", "prototype"]) {
      expect(() => createTemplateContext({ [key]: "value" })).toThrow(
        TemplateRenderError
      );
    }

    expect(() =>
      createTemplateContext(JSON.parse('{"__proto__":"value"}') as Record<
        string,
        unknown
      >)
    ).toThrow(TemplateRenderError);
  });

  it("validates context values before rendering", () => {
    expect(() => createTemplateContext({ name: null })).toThrow(TemplateRenderError);
    expect(() => createTemplateContext({ name: ["SpecForge"] })).toThrow(
      TemplateRenderError
    );
    expect(() => createTemplateContext({ name: { nested: true } })).toThrow(
      TemplateRenderError
    );
  });

  it("rejects non-object context values", () => {
    expect(() =>
      createTemplateContext(null as unknown as Record<string, unknown>)
    ).toThrow(TemplateRenderError);
    expect(() =>
      createTemplateContext(["SpecForge"] as unknown as Record<string, unknown>)
    ).toThrow(TemplateRenderError);
  });
});
