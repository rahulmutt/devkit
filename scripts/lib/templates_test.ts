import { expect, test } from "bun:test";
import { renderTemplate, templateVars } from "./templates.ts";
import { config } from "../../marketplace.config.ts";

test("renderTemplate substitutes tokens", () => {
  expect(renderTemplate("hi {{pluginName}}", { pluginName: "devkit" })).toEqual(
    "hi devkit",
  );
});

test("renderTemplate throws on unresolved token", () => {
  expect(() => renderTemplate("a {{missing}}", {})).toThrow("missing");
});

test("templateVars includes bootstrapSkill", () => {
  expect(templateVars(config).bootstrapSkill).toEqual("using-devkit");
});
