import { assertEquals, assertThrows } from "@std/assert";
import { renderTemplate, templateVars } from "./templates.ts";
import { config } from "../../marketplace.config.ts";

Deno.test("renderTemplate substitutes tokens", () => {
  assertEquals(renderTemplate("hi {{pluginName}}", { pluginName: "devkit" }), "hi devkit");
});

Deno.test("renderTemplate throws on unresolved token", () => {
  assertThrows(() => renderTemplate("a {{missing}}", {}), Error, "missing");
});

Deno.test("templateVars includes bootstrapSkill", () => {
  assertEquals(templateVars(config).bootstrapSkill, "using-devkit");
});
